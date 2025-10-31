'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Medal, Frown, ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  email: string;
  since: Date;
}

interface TrainerMassichatInterfaceProps {
  trainerId: string;
  sessionId?: string;
  athleteId?: string;
  onWorkoutAccepted?: () => void;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface WorkoutItemPreview {
  exerciseName: string;
  sets: number;
  reps: number;
  restSeconds?: number;
  notes?: string;
}

interface WorkoutProposal {
  id: string;
  summary?: string;
  workoutData?: {
    title?: string;
    description?: string;
    items?: WorkoutItemPreview[];
  };
}

export function TrainerMassichatInterface({ trainerId, sessionId, athleteId, onWorkoutAccepted }: TrainerMassichatInterfaceProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(athleteId || null);
  const [loading, setLoading] = useState(false);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string }>>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [workoutProposal, setWorkoutProposal] = useState<WorkoutProposal | null>(null);
  const [editable, setEditable] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', isPublic: false, difficulty: 'INTERMEDIATE', tags: '' });
  const [renaming, setRenaming] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch athletes list on mount
  useEffect(() => {
    fetchAthletes();
  }, []);

  // Load sessions when athlete changes
  useEffect(() => {
    if (selectedAthlete) {
      fetchSessions();
    }
  }, [selectedAthlete]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function fetchAthletes() {
    try {
      setLoadingAthletes(true);
      const response = await fetch('/api/coaching/athletes');
      if (response.ok) {
        const data = await response.json();
        const athletesList = (data.withProfile || []).map((a: any) => ({
          id: a.clientId,
          name: a.client?.name || null,
          email: a.client?.email || '',
          since: a.startDate,
        }));
        setAthletes(athletesList);
        if (athletesList.length > 0 && !selectedAthlete) {
          setSelectedAthlete(athletesList[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching athletes:', error);
    } finally {
      setLoadingAthletes(false);
    }
  }

  async function fetchSessions() {
    if (!selectedAthlete) return;
    try {
      setLoadingSessions(true);
      const response = await fetch(`/api/massichat?list=true&athleteId=${selectedAthlete}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadSession(id: string) {
    try {
      const response = await fetch(`/api/massichat?sessionId=${encodeURIComponent(id)}&athleteId=${selectedAthlete}`);
      if (response.ok) {
        const data = await response.json();
        setChatSessionId(id);
        const msgs = (data.messages || [])
          .filter((m: any) => (m.role === 'user' || m.role === 'assistant'));
        setMessages(msgs);
        setWorkoutProposal(null);
        setEditable(null);
        setShowPreview(false);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }

  async function deleteSession(id: string) {
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    try {
      const response = await fetch(`/api/massichat?sessionId=${encodeURIComponent(id)}&athleteId=${selectedAthlete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear current session if it was deleted
        if (chatSessionId === id) {
          setChatSessionId(null);
          setMessages([]);
          setWorkoutProposal(null);
          setEditable(null);
        }
        // Refresh sessions list
        fetchSessions();
        setFlashMessage('Session deleted successfully');
        setTimeout(() => setFlashMessage(null), 3000);
      } else {
        alert('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || !selectedAthlete) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/massichat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: chatSessionId,
          athleteId: selectedAthlete,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setChatSessionId(data.sessionId);

      const assistantMessage: ChatMessage = {
        id: data.messageId,
        role: 'assistant',
        content: cleanAIResponse(data.message),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.workoutProposal) {
        setWorkoutProposal(data.workoutProposal);
        setEditable(data.workoutProposal.workoutData || {});
      }

      if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
      }

      await fetchSessions();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function cleanAIResponse(text: string): string {
    let cleaned = text.replace(/```json[\s\S]*?```/gi, '');
    cleaned = cleaned.replace(/WORKOUT_PROPOSAL_JSON/gi, '');
    cleaned = cleaned.replace(/FOLLOW_UP_SUGGESTIONS\s*:\s*\[.*?\]/gi, '');
    return cleaned.trim();
  }

  async function acceptWorkout() {
    if (!workoutProposal?.id) return;

    try {
      const response = await fetch(`/api/massichat/proposals/${workoutProposal.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overrides: editable,
          sessionId: sessionId || null,
          athleteId: selectedAthlete || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept workout');
      }

      setFlashMessage('Workout added to athlete log successfully!');
      setTimeout(() => setFlashMessage(null), 3000);
      setWorkoutProposal(null);
      setEditable(null);
      setShowPreview(false);
      setEditMode(false);

      // Refresh session data to show new exercises
      if (onWorkoutAccepted) {
        onWorkoutAccepted();
      }
    } catch (error) {
      console.error('Error accepting workout:', error);
      alert('Failed to add workout. Please try again.');
    }
  }

  function onItemChange(idx: number, updates: Partial<WorkoutItemPreview>) {
    if (!editable?.items) return;
    const newItems = [...editable.items];
    newItems[idx] = { ...newItems[idx], ...updates };
    setEditable({ ...editable, items: newItems });
  }

  function moveItem(idx: number, direction: number) {
    if (!editable?.items) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= editable.items.length) return;
    const newItems = [...editable.items];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    setEditable({ ...editable, items: newItems });
  }

  function removeItem(idx: number) {
    if (!editable?.items) return;
    const newItems = editable.items.filter((_: any, i: number) => i !== idx);
    setEditable({ ...editable, items: newItems });
  }

  function addItem() {
    if (!editable) return;
    const newItem: WorkoutItemPreview = { exerciseName: 'New Exercise', sets: 3, reps: 10, restSeconds: 60 };
    setEditable({ ...editable, items: [...(editable.items || []), newItem] });
  }

  function totals(data: any) {
    const items = data?.items || [];
    const totalSets = items.reduce((sum: number, it: any) => sum + (it.sets || 0), 0);
    const totalReps = items.reduce((sum: number, it: any) => sum + (it.sets || 0) * (it.reps || 0), 0);
    const totalRestMin = Math.round(items.reduce((sum: number, it: any) => sum + ((it.restSeconds || 0) * (it.sets || 0)) / 60, 0));
    return { totalSets, totalReps, totalRestMin };
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatInline(text: string) {
    let safe = escapeHtml(text);
    safe = safe.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded">$1</code>');
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-brand-primary underline">$1</a>');
    safe = safe.replace(/(?<!["'>])(https?:\/\/[^\s<]+)(?![^<]*>)/g, '<a href="$1" target="_blank" rel="noopener" class="text-brand-primary underline">$1</a>');
    return safe;
  }

  function renderMarkdown(text: string) {
    const lines = text.split(/\r?\n/);
    const elements: JSX.Element[] = [];
    let list: string[] = [];
    let para: string[] = [];

    const flushPara = () => {
      if (para.length) {
        const content = para.join(' ');
        elements.push(<div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatInline(content) }} />);
        para = [];
      }
    };

    const flushList = () => {
      if (list.length) {
        elements.push(
          <ul className="list-disc pl-5 space-y-1">
            {list.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
        list = [];
      }
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { flushPara(); flushList(); continue; }
      if (/^[-\*]\s+/.test(line)) { flushPara(); list.push(line.replace(/^[-\*]\s+/, '')); continue; }
      if (/^###\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-semibold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^###\s+/, '')) }} />); continue; }
      if (/^##\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-semibold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^##\s+/, '')) }} />); continue; }
      if (/^#\s+/.test(line)) { flushPara(); flushList(); elements.push(<div className="font-bold" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^#\s+/, '')) }} />); continue; }
      para.push(line);
    }

    flushPara(); flushList();
    return <>{elements.map((el, i) => <div key={i}>{el}</div>)}</>;
  }

  const selectedAthleteName = athletes.find(a => a.id === selectedAthlete)?.name || 'Select Athlete';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>💬 Massichat Plus</CardTitle>
            <CardDescription className="mt-1">
              AI Fitness Coach specifically crafted for trainers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setChatSessionId(null); setMessages([]); setWorkoutProposal(null); setEditable(null); }}>
              New Chat
            </Button>
          </div>
        </div>

        {/* Athlete Selector */}
        <div className="mt-4 flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Planning for:</label>
          <select
            className="flex-1 px-3 py-2 border rounded-md text-sm"
            value={selectedAthlete || ''}
            onChange={(e) => {
              setSelectedAthlete(e.target.value);
              setChatSessionId(null);
              setMessages([]);
              setWorkoutProposal(null);
            }}
            disabled={loadingAthletes}
          >
            {loadingAthletes ? (
              <option>Loading athletes...</option>
            ) : athletes.length === 0 ? (
              <option>No athletes found</option>
            ) : (
              athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name || athlete.email}
                </option>
              ))
            )}
          </select>
        </div>

        {flashMessage && (
          <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 inline-block">
            {flashMessage}
          </div>
        )}

        {/* Sessions */}
        {selectedAthlete && (
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Recent Sessions</div>
              <div className="flex items-center gap-2">
                {chatSessionId && (
                  <>
                    <Button variant="ghost" size="sm" disabled={true}>Rename</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession(chatSessionId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </>
                )}
                {loadingSessions && <div className="text-xs text-gray-500">Loading…</div>}
              </div>
            </div>
            <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`text-xs px-2 py-1 rounded border ${chatSessionId === s.id ? 'bg-gray-200' : 'bg-white'} hover:bg-gray-100`}
                >
                  {s.title || 'Untitled'}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {!selectedAthlete ? (
          <div className="text-center py-12 text-gray-500">
            Select an athlete to start planning workouts
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chat Messages */}
            <div ref={scrollRef} className="h-80 overflow-y-auto space-y-3 rounded border p-3 bg-white">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                    {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-600">
                    <span>Massichat is typing</span>
                    <span className="inline-block animate-pulse">...</span>
                  </div>
                </div>
              )}
              {messages.length === 0 && (
                <div className="text-sm text-gray-500">
                  Ask me to create a workout for {selectedAthleteName}. Example: "Create a leg day workout focusing on quad development."
                </div>
              )}
            </div>

            {/* Workout Proposal */}
            {workoutProposal && (
              <Card className="border-2 border-green-500">
                <CardHeader>
                  <CardTitle>🏋️ Proposed Workout for {selectedAthleteName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        <div className="font-medium">{(editable?.title || workoutProposal.workoutData?.title) || workoutProposal.summary || 'New workout available'}</div>
                        {(editable?.description || workoutProposal.workoutData?.description) && (
                          <div className="text-xs text-gray-500 mt-0.5">{editable?.description || workoutProposal.workoutData?.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {workoutProposal.workoutData?.items?.length ? (
                          <Button variant="secondary" size="sm" onClick={() => setShowPreview((s) => !s)}>
                            {showPreview ? 'Hide' : 'Preview'}
                          </Button>
                        ) : null}
                        <Button onClick={acceptWorkout} size="sm">Accept & Add</Button>
                      </div>
                    </div>

                    {showPreview && workoutProposal.workoutData?.items && (
                      <div className="rounded border bg-white p-2 space-y-2">
                        <div className="text-xs text-gray-600">
                          Totals: {totals(editable || workoutProposal.workoutData).totalSets} sets • {totals(editable || workoutProposal.workoutData).totalReps} reps
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="px-2 py-1 w-16">#</th>
                                <th className="px-2 py-1">Exercise</th>
                                <th className="px-2 py-1">Sets</th>
                                <th className="px-2 py-1">Reps</th>
                                <th className="px-2 py-1">Rest (s)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {((editable?.items || workoutProposal.workoutData?.items || []) as WorkoutItemPreview[]).map((it, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="px-2 py-1"><span className="text-gray-500">{idx + 1}</span></td>
                                  <td className="px-2 py-1 font-medium">{it.exerciseName || 'Exercise'}</td>
                                  <td className="px-2 py-1">{it.sets ?? '-'}</td>
                                  <td className="px-2 py-1">{it.reps ?? '-'}</td>
                                  <td className="px-2 py-1">{it.restSeconds ?? '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 4).map((s, i) => (
                  <Button key={i} variant="secondary" size="sm" onClick={() => { setInput(s); setTimeout(() => sendMessage(), 0); }}>
                    {s}
                  </Button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Plan a workout for ${selectedAthleteName}...`}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!selectedAthlete}
              />
              <Button onClick={sendMessage} disabled={loading || !selectedAthlete}>
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
