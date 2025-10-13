'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { saveAssessment, loadAssessment } from './actions'

// Import assessment templates
import lifestyleHealthHistory from '@/components/assessments/lifestyle_health_history.json'
import parQPlus from '@/components/assessments/par_q_plus.json'
import bodyComposition from '@/components/assessments/body_composition.json'
import staticPosturalAssessment from '@/components/assessments/static_postural_assessment.json'
import dynamicPosturalAssessment from '@/components/assessments/dynamic_postural_assessment.json'
import cardioAssessment from '@/components/assessments/cardio_assessment.json'

interface AssessmentClientProps {
  trainerId: string
  clients: Array<{
    id: string
    name: string | null
    email: string | null
  }>
}

interface AssessmentTemplate {
  id: string
  title: string
  version?: string
  sections: Array<{
    id: string
    title: string
    description?: string
    conditional?: {
      field?: string
      value?: string
      any_of?: string[]
    }
    fields?: Array<{
      id: string
      type: string
      label: string
      required?: boolean
      options?: string[]
      min?: number
      max?: number
      decimal?: boolean | number
      conditional?: {
        field: string
        value: string
      }
      help_text?: string
      placeholder?: string
      rows?: number
      formula?: string
    }>
    subsections?: Array<{
      id: string
      title: string
      fields: Array<{
        id: string
        type: string
        label: string
        required?: boolean
        options?: string[]
        min?: number
        max?: number
        decimal?: boolean | number
        conditional?: {
          field: string
          value: string
        }
        help_text?: string
        placeholder?: string
        rows?: number
        formula?: string
      }>
    }>
  }>
  muscle_imbalance_reference?: any
}

const assessmentTemplates: Record<string, AssessmentTemplate> = {
  lifestyle_health_history: lifestyleHealthHistory,
  par_q_plus: parQPlus,
  body_composition: bodyComposition,
  static_postural_assessment: staticPosturalAssessment,
  dynamic_postural_assessment: dynamicPosturalAssessment,
  cardio_assessment: cardioAssessment,
}

// Assessment types that have templates
const availableAssessments = [
  { id: 'lifestyle_health_history', name: 'Lifestyle & Health History' },
  { id: 'par_q_plus', name: 'PAR-Q+ Screening' },
  { id: 'body_composition', name: 'Body Composition Assessment' },
  { id: 'static_postural_assessment', name: 'Static Postural Assessment' },
  { id: 'dynamic_postural_assessment', name: 'Dynamic Postural Assessment' },
  { id: 'cardio_assessment', name: 'Cardiorespiratory Assessment' },
]

export default function AssessmentClient({ trainerId, clients }: AssessmentClientProps) {
  const [selectedAssessment, setSelectedAssessment] = useState('lifestyle_health_history')
  const [selectedClient, setSelectedClient] = useState('')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [currentSection, setCurrentSection] = useState(0)
  const [loading, setLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [lastCompletedAssessmentId, setLastCompletedAssessmentId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const currentTemplate = assessmentTemplates[selectedAssessment]
  const visibleSections = currentTemplate?.sections.filter(section => {
    if (!section.conditional) return true

    if (section.conditional.field && section.conditional.value) {
      return formData[section.conditional.field] === section.conditional.value
    }

    if (section.conditional.any_of) {
      return section.conditional.any_of.some(fieldId => formData[fieldId] === 'Yes')
    }

    return true
  }) || []

  // Load existing assessment data when client/assessment changes
  useEffect(() => {
    if (selectedClient && selectedAssessment) {
      loadExistingAssessment()
    }
  }, [selectedClient, selectedAssessment])

  // Auto-save every 10 seconds
  useEffect(() => {
    if (selectedClient && Object.keys(formData).length > 0) {
      const interval = setInterval(() => {
        handleAutoSave()
      }, 10000)
      return () => clearInterval(interval)
    }
    return () => {} // Return empty cleanup function when condition is not met
  }, [selectedClient, formData])

  const loadExistingAssessment = async () => {
    if (!selectedClient) return

    try {
      const result = await loadAssessment(trainerId, selectedClient, selectedAssessment)
      if (result.success && result.data) {
        const assessmentData = result.data.data
        if (assessmentData && typeof assessmentData === 'object') {
          setFormData(assessmentData as Record<string, any>)
        }
      }
    } catch (error) {
      console.error('Error loading assessment:', error)
    }
  }

  const handleAutoSave = async () => {
    if (!selectedClient || saveStatus === 'saving') return

    setSaveStatus('saving')
    try {
      const result = await saveAssessment({
        trainerId,
        clientId: selectedClient,
        type: selectedAssessment,
        data: formData,
        status: 'draft'
      })

      if (result.success) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      setSaveStatus('error')
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    const newData = { ...formData, [fieldId]: value }

    // Handle calculated fields
    if (currentTemplate) {
      currentTemplate.sections.forEach(section => {
        if (section.fields) {
          section.fields.forEach(field => {
            if (field.type === 'calculated' && field.formula) {
              const calculatedValue = calculateField(field.formula, newData)
              if (calculatedValue !== null) {
                newData[field.id] = calculatedValue
              }
            }
          })
        }

        if (section.subsections) {
          section.subsections.forEach(subsection => {
            subsection.fields.forEach(field => {
              if (field.type === 'calculated' && field.formula) {
                const calculatedValue = calculateField(field.formula, newData)
                if (calculatedValue !== null) {
                  newData[field.id] = calculatedValue
                }
              }
            })
          })
        }
      })
    }

    setFormData(newData)
  }

  const calculateField = (formula: string, data: Record<string, any>): number | null => {
    try {
      if (formula === 'weight / (height/100)^2') {
        const weight = parseFloat(data.weight)
        const height = parseFloat(data.height)
        if (weight && height) {
          return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10
        }
      }

      if (formula === 'avg(waist) / avg(hips)') {
        const waist1 = parseFloat(data.waist_1) || 0
        const waist2 = parseFloat(data.waist_2) || 0
        const hips1 = parseFloat(data.hips_1) || 0
        const hips2 = parseFloat(data.hips_2) || 0

        const avgWaist = (waist1 + waist2) / 2
        const avgHips = (hips1 + hips2) / 2

        if (avgWaist && avgHips) {
          return Math.round((avgWaist / avgHips) * 100) / 100
        }
      }

      if (formula === '220 - age') {
        const age = parseFloat(data.age)
        if (age) {
          return 220 - age
        }
      }

      return null
    } catch (error) {
      console.error('Calculation error:', error)
      return null
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.id] || ''
    const isVisible = !field.conditional || formData[field.conditional.field] === field.conditional.value

    if (!isVisible) return null

    const fieldProps = {
      id: field.id,
      value,
      onChange: (e: any) => handleFieldChange(field.id, e.target.value),
      required: field.required,
      placeholder: field.placeholder,
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input {...fieldProps} type={field.type} />
            {field.help_text && (
              <p className="text-sm text-gray-500">{field.help_text}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              {...fieldProps}
              type="number"
              min={field.min}
              max={field.max}
              step={field.decimal ? "0.1" : "1"}
            />
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input {...fieldProps} type="date" />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Textarea
              {...fieldProps}
              rows={field.rows || 3}
            />
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="flex gap-4">
              {field.options?.map((option: string) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
            {field.help_text && (
              <p className="text-sm text-gray-500">{field.help_text}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                className="text-blue-600"
              />
              <span>{field.label}</span>
            </label>
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <select
              {...fieldProps}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select...</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'scale':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{field.min}</span>
              <input
                type="range"
                min={field.min}
                max={field.max}
                value={value}
                onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">{field.max}</span>
              <Badge variant="outline" className="min-w-[3rem] text-center">
                {value || field.min}
              </Badge>
            </div>
          </div>
        )

      case 'calculated':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="text-lg font-semibold text-blue-600">
                {value || 'Calculating...'}
              </span>
            </div>
          </div>
        )

      case 'signature':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Signature capture not implemented in this demo</p>
            </div>
          </div>
        )

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input {...fieldProps} />
          </div>
        )
    }
  }

  const handleCompleteAssessment = async () => {
    if (!selectedClient) return

    setLoading(true)
    try {
      const result = await saveAssessment({
        trainerId,
        clientId: selectedClient,
        type: selectedAssessment,
        data: formData,
        status: 'complete'
      })

      if (result.success) {
        // Save the assessment id for follow-up actions
        const id = (result as any)?.data?.id as string | undefined
        if (id) setLastCompletedAssessmentId(id)
        alert('Assessment completed successfully!')
      } else {
        alert('Error completing assessment: ' + result.error)
      }
    } catch (error) {
      alert('Error completing assessment')
    } finally {
      setLoading(false)
    }
  }

  const generateWithMassichat = async () => {
    if (!lastCompletedAssessmentId) return
    try {
      setGenerateLoading(true)
      const res = await fetch(`/api/massichat/assessments/${encodeURIComponent(lastCompletedAssessmentId)}/generate`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data?.error || 'Failed to generate workout from assessment')
        return
      }
      // Navigate to dashboard where Massichat lives, deep-linking to the session
      const sid = data?.sessionId
      const q = sid ? `?massichatSession=${encodeURIComponent(sid)}&generated=1` : ''
      window.location.href = `/dashboard${q}`
    } catch (e: any) {
      alert(e?.message || 'Failed to generate workout')
    } finally {
      setGenerateLoading(false)
    }
  }

  const getCompletionPercentage = () => {
    if (!currentTemplate) return 0

    const totalFields = currentTemplate.sections.reduce((total, section) => {
      let sectionFields: any[] = []

      if (section.fields) {
        sectionFields = section.fields.filter(field =>
          !field.conditional || formData[field.conditional.field] === field.conditional.value
        )
      }

      if (section.subsections) {
        section.subsections.forEach(subsection => {
          const subsectionFields = subsection.fields.filter(field =>
            !field.conditional || formData[field.conditional.field] === field.conditional.value
          )
          sectionFields = sectionFields.concat(subsectionFields)
        })
      }

      return total + sectionFields.filter(field => field.required).length
    }, 0)

    const completedFields = currentTemplate.sections.reduce((completed, section) => {
      let sectionFields: any[] = []

      if (section.fields) {
        sectionFields = section.fields.filter(field =>
          !field.conditional || formData[field.conditional.field] === field.conditional.value
        )
      }

      if (section.subsections) {
        section.subsections.forEach(subsection => {
          const subsectionFields = subsection.fields.filter(field =>
            !field.conditional || formData[field.conditional.field] === field.conditional.value
          )
          sectionFields = sectionFields.concat(subsectionFields)
        })
      }

      return completed + sectionFields.filter(field =>
        field.required && formData[field.id] !== undefined && formData[field.id] !== ''
      ).length
    }, 0)

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
  }

  if (!currentTemplate) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Assessment template not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Assessment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Setup</CardTitle>
          <CardDescription>
            Select the client and assessment type to begin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Select Client</Label>
              <select
                id="client"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment Type</Label>
              <select
                id="assessment"
                value={selectedAssessment}
                onChange={(e) => setSelectedAssessment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {availableAssessments.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {assessment.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedClient && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  Progress: {getCompletionPercentage()}%
                </Badge>
                <Badge variant={saveStatus === 'saved' ? 'default' : saveStatus === 'saving' ? 'secondary' : 'outline'}>
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'saved' && 'Saved'}
                  {saveStatus === 'error' && 'Save Error'}
                  {saveStatus === 'idle' && 'Auto-save enabled'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCompleteAssessment}
                  disabled={!selectedClient || loading || getCompletionPercentage() < 100}
                >
                  {loading ? 'Completing...' : 'Complete Assessment'}
                </Button>
                {lastCompletedAssessmentId && (
                  <Button
                    variant="outline"
                    onClick={generateWithMassichat}
                    disabled={generateLoading}
                    title="Generate a workout with Massichat using this assessment"
                  >
                    {generateLoading ? 'Generating…' : 'Generate with Massichat'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Form */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle>{currentTemplate.title}</CardTitle>
            <CardDescription>
              {currentTemplate.version && `Version ${currentTemplate.version}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentSection.toString()} onValueChange={(value) => setCurrentSection(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                {visibleSections.slice(0, 4).map((section, index) => (
                  <TabsTrigger key={section.id} value={index.toString()}>
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {visibleSections.map((section, index) => (
                <TabsContent key={section.id} value={index.toString()} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                    {section.description && (
                      <p className="text-gray-600 mb-4">{section.description}</p>
                    )}
                  </div>

                  <div className="space-y-6">
                    {section.fields && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {section.fields.map(renderField)}
                      </div>
                    )}

                    {section.subsections && section.subsections.map((subsection) => (
                      <div key={subsection.id} className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-800 border-b pb-2">
                          {subsection.title}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {subsection.fields.map(renderField)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                      disabled={currentSection === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentSection(Math.min(visibleSections.length - 1, currentSection + 1))}
                      disabled={currentSection === visibleSections.length - 1}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
