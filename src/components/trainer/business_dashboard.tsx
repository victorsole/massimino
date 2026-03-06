// src/components/trainer/business_dashboard.tsx

'use client'

/**
 * Business Dashboard — Trainer revenue, Stripe Connect onboarding,
 * subscriptions, packages, payments, and analytics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Euro, TrendingUp, Users, Package, CreditCard,
  Download, Send, RefreshCw, Plus, Edit, Trash2,
  Activity, AlertCircle, CheckCircle, ExternalLink,
  Clock, Filter, FileText, Mail, ArrowUpRight,
  ArrowDownRight, Zap, Shield, Wallet, BarChart3,
  Link2
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ConnectStatus {
  hasAccount: boolean;
  accountId?: string;
  isOnboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
}

interface BusinessDashboardData {
  revenueMetrics: {
    totalRevenue: number;
    netEarnings: number;
    commission: number;
    sessionsRevenue: number;
    packagesRevenue: number;
    subscriptionsRevenue: number;
    previousPeriodRevenue: number;
    growth: number;
    averageSessionPrice: number;
    totalSessions: number;
    totalPackagesSold: number;
    activeSubscriptions: number;
  };
  paymentAnalytics: {
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    refundedPayments: number;
    averagePaymentAmount: number;
    paymentMethods: Array<{ method: string; count: number }>;
    monthlyTrends: Array<{ month: string; revenue: number }>;
    clientAnalytics: Array<{ clientId: string; totalPaid: number; sessionsCount: number }>;
  };
  subscriptions: Array<{
    id: string;
    name: string;
    price: number;
    interval: string;
    features: string[];
    activeSubscribers: number;
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
    createdAt: Date;
  }>;
  packages: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    sessionsIncluded: number;
    validityDays: number;
    features: string[];
    totalSold: number;
    revenue: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
  }>;
}

interface PaymentHistoryItem {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  description: string;
  type: 'session' | 'package' | 'subscription' | 'custom';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: Date;
  dueDate?: Date;
  paidAt?: Date;
}

// ============================================================================
// HELPERS
// ============================================================================

function euro(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function pct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// ============================================================================
// STRIPE CONNECT ONBOARDING BANNER
// ============================================================================

function ConnectBanner({ status, onRefresh }: { status: ConnectStatus | null; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const stripeReturn = searchParams.get('stripe');

  useEffect(() => {
    if (stripeReturn === 'return' || stripeReturn === 'refresh') {
      onRefresh();
    }
  }, [stripeReturn, onRefresh]);

  const handleAction = async (action: string, country?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...(country ? { country } : {}) }),
      });
      const data = await res.json();
      if (data.success) {
        const url = data.data.onboardingUrl || data.data.loginUrl;
        if (url) window.location.href = url;
      }
    } catch (err) {
      console.error('Connect action error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fully onboarded — compact success strip
  if (status?.isOnboarded) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900">Stripe Connected</p>
            <p className="text-xs text-emerald-700">Payments and payouts are active</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          onClick={() => handleAction('login-link')}
          disabled={loading}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Stripe Dashboard
        </Button>
      </div>
    );
  }

  // Has account but not fully onboarded
  if (status?.hasAccount && !status.isOnboarded) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Complete Your Stripe Setup</h3>
            <p className="text-sm text-amber-700 mt-1">
              Your Stripe account needs a few more details before you can accept payments.
              {!status.chargesEnabled && ' Charges are not yet enabled.'}
              {!status.payoutsEnabled && ' Payouts are not yet enabled.'}
            </p>
          </div>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            onClick={() => handleAction('onboarding-link')}
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Continue Setup
          </Button>
        </div>
      </div>
    );
  }

  // No account yet — full onboarding CTA
  return (
    <div className="rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-br from-[#2b5069] via-[#35607d] to-[#1e3a4f] p-8 text-white relative">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-5 w-5 text-white/80" />
                <span className="text-xs font-medium uppercase tracking-wider text-white/60">Powered by Stripe</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Start Getting Paid</h2>
              <p className="text-white/80 text-sm sm:text-base max-w-lg">
                Connect your bank account to receive payments from athletes directly.
                Secure payments, automatic payouts, and real-time analytics.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Secure & encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Instant setup
                </span>
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Cards, Bancontact, iDEAL
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Button
                size="lg"
                className="bg-white text-[#2b5069] hover:bg-white/90 font-semibold shadow-lg"
                onClick={() => handleAction('create-account', 'BE')}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                Connect with Stripe
              </Button>
              <p className="text-[10px] text-white/40 text-center">Takes about 5 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// METRIC CARD
// ============================================================================

function MetricCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
        <div className="h-8 w-8 rounded-lg bg-[#2b5069]/5 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#2b5069]" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {trend !== undefined && (
          <span className={`inline-flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {pct(trend)}
          </span>
        )}
        <span className="text-xs text-gray-400">{subtitle}</span>
      </div>
    </div>
  );
}

// ============================================================================
// REVENUE BAR (simple visual bar for breakdown)
// ============================================================================

function RevenueBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pctWidth = total > 0 ? Math.max((amount / total) * 100, 2) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{euro(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctWidth}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BusinessDashboard() {
  const { data: session } = useSession();
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [dashboardData, setDashboardData] = useState<BusinessDashboardData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentFilters, setPaymentFilters] = useState({ status: '', type: '', search: '' });

  const isTrainer = session?.user?.role === 'TRAINER' || session?.user?.role === 'ADMIN';

  // ---------- Fetch Connect status ----------
  const fetchConnectStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/connect');
      const data = await res.json();
      if (data.success) setConnectStatus(data.data);
    } catch (err) {
      console.error('Connect status fetch error:', err);
    }
  }, []);

  // ---------- Fetch dashboard data ----------
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payments/trainer?action=dashboard&period=${period}`);
      const data = await res.json();
      if (data.success) setDashboardData(data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  // ---------- Fetch payment history ----------
  const fetchPaymentHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        action: 'payments',
        ...(paymentFilters.status && { status: paymentFilters.status }),
        ...(paymentFilters.type && { type: paymentFilters.type }),
      });
      const res = await fetch(`/api/payments/trainer?${params}`);
      const data = await res.json();
      if (data.success) setPaymentHistory(data.data.payments);
    } catch (err) {
      console.error('Payment history fetch error:', err);
    }
  }, [paymentFilters]);

  useEffect(() => {
    if (!isTrainer) { setLoading(false); return; }
    fetchConnectStatus();
    fetchDashboardData();
  }, [isTrainer, fetchConnectStatus, fetchDashboardData]);

  useEffect(() => {
    if (activeTab === 'payments' && isTrainer) fetchPaymentHistory();
  }, [activeTab, isTrainer, fetchPaymentHistory]);

  // ============================================================================
  // TAB: OVERVIEW
  // ============================================================================

  const OverviewTab = () => {
    if (!dashboardData) {
      return (
        <div className="text-center py-16 text-gray-400">
          {loading ? (
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3" />
          ) : (
            <>
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No revenue data yet. Create plans or packages to get started.</p>
            </>
          )}
        </div>
      );
    }

    const m = dashboardData.revenueMetrics;
    const totalBreakdown = m.sessionsRevenue + m.packagesRevenue + m.subscriptionsRevenue;

    return (
      <div className="space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={euro(m.totalRevenue)}
            subtitle={`this ${period}`}
            icon={Euro}
            trend={m.growth}
          />
          <MetricCard
            title="Net Earnings"
            value={euro(m.netEarnings)}
            subtitle={`after ${euro(m.commission)} fees`}
            icon={TrendingUp}
          />
          <MetricCard
            title="Subscriptions"
            value={String(m.activeSubscriptions)}
            subtitle={`${euro(m.subscriptionsRevenue)} recurring`}
            icon={Users}
          />
          <MetricCard
            title="Avg. Session"
            value={euro(m.averageSessionPrice)}
            subtitle={`${m.totalSessions} sessions`}
            icon={Activity}
          />
        </div>

        {/* Revenue breakdown + quick actions */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Revenue Breakdown</h3>
            <div className="space-y-4">
              <RevenueBar label="Sessions" amount={m.sessionsRevenue} total={totalBreakdown} color="#2b5069" />
              <RevenueBar label="Packages" amount={m.packagesRevenue} total={totalBreakdown} color="#4a8ab5" />
              <RevenueBar label="Subscriptions" amount={m.subscriptionsRevenue} total={totalBreakdown} color="#7bc4a8" />
            </div>
            <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-900">{euro(totalBreakdown)}</span>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <button
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 p-4 text-xs font-medium text-gray-600 hover:bg-[#2b5069]/5 hover:border-[#2b5069]/20 transition-colors"
                onClick={() => setActiveTab('subscriptions')}
              >
                <Plus className="h-5 w-5 text-[#2b5069]" />
                New Plan
              </button>
              <button
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 p-4 text-xs font-medium text-gray-600 hover:bg-[#2b5069]/5 hover:border-[#2b5069]/20 transition-colors"
                onClick={() => setActiveTab('packages')}
              >
                <Package className="h-5 w-5 text-[#2b5069]" />
                New Package
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 p-4 text-xs font-medium text-gray-600 hover:bg-[#2b5069]/5 hover:border-[#2b5069]/20 transition-colors">
                <Mail className="h-5 w-5 text-[#2b5069]" />
                Send Invoice
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 p-4 text-xs font-medium text-gray-600 hover:bg-[#2b5069]/5 hover:border-[#2b5069]/20 transition-colors">
                <FileText className="h-5 w-5 text-[#2b5069]" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB: SUBSCRIPTIONS
  // ============================================================================

  const SubscriptionsTab = () => {
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', price: '', interval: 'monthly', features: [''] });

    const handleCreate = async () => {
      try {
        const res = await fetch('/api/payments/trainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-subscription',
            ...form,
            price: parseInt(form.price) * 100,
            features: form.features.filter(f => f.trim()),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowCreate(false);
          setForm({ name: '', description: '', price: '', interval: 'monthly', features: [''] });
          fetchDashboardData();
        }
      } catch (err) {
        console.error('Create subscription error:', err);
      }
    };

    const subs = dashboardData?.subscriptions || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
            <p className="text-sm text-gray-500">Recurring plans for your athletes</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-[#2b5069] hover:bg-[#1e3a4f]">
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Subscription Plan</DialogTitle>
                <DialogDescription>Set up a recurring plan for your athletes</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Plan Name</Label>
                  <Input
                    className="mt-1"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Premium Training"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="mt-1"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Full training program with nutrition coaching"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price (EUR)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="99"
                    />
                  </div>
                  <div>
                    <Label>Billing Cycle</Label>
                    <Select value={form.interval} onValueChange={v => setForm(p => ({ ...p, interval: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Features</Label>
                  <div className="mt-1 space-y-2">
                    {form.features.map((f, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={f}
                          onChange={e => setForm(p => ({ ...p, features: p.features.map((x, j) => j === i ? e.target.value : x) }))}
                          placeholder="Feature description"
                        />
                        {form.features.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setForm(p => ({ ...p, features: p.features.filter((_, j) => j !== i) }))}>
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="text-[#2b5069]" onClick={() => setForm(p => ({ ...p, features: [...p.features, ''] }))}>
                      <Plus className="h-3 w-3 mr-1" /> Add feature
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button className="bg-[#2b5069] hover:bg-[#1e3a4f]" onClick={handleCreate}>Create Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {subs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">No subscription plans yet</p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>Create Your First Plan</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subs.map(sub => (
              <div key={sub.id} className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{sub.name}</h4>
                    <p className="text-sm text-gray-500">{euro(sub.price)} / {sub.interval}</p>
                  </div>
                  <Badge className={sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}>
                    {sub.status}
                  </Badge>
                </div>
                {sub.features.length > 0 && (
                  <ul className="space-y-1.5 mb-4">
                    {sub.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{sub.activeSubscribers}</span>
                    <span className="text-xs text-gray-400">subscribers</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#2b5069]">
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // TAB: PACKAGES
  // ============================================================================

  const PackagesTab = () => {
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', price: '', sessionsIncluded: '', validityDays: '90', features: [''] });

    const handleCreate = async () => {
      try {
        const res = await fetch('/api/payments/trainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-package',
            ...form,
            price: parseInt(form.price) * 100,
            sessionsIncluded: parseInt(form.sessionsIncluded),
            validityDays: parseInt(form.validityDays),
            features: form.features.filter(f => f.trim()),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowCreate(false);
          setForm({ name: '', description: '', price: '', sessionsIncluded: '', validityDays: '90', features: [''] });
          fetchDashboardData();
        }
      } catch (err) {
        console.error('Create package error:', err);
      }
    };

    const pkgs = dashboardData?.packages || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Training Packages</h3>
            <p className="text-sm text-gray-500">Bundle sessions into packages for your athletes</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-[#2b5069] hover:bg-[#1e3a4f]">
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Training Package</DialogTitle>
                <DialogDescription>Bundle sessions into a discounted package</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Package Name</Label>
                  <Input className="mt-1" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="10-Session Package" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea className="mt-1" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Perfect for committed athletes" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Price (EUR)</Label>
                    <Input className="mt-1" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="500" />
                  </div>
                  <div>
                    <Label>Sessions</Label>
                    <Input className="mt-1" type="number" value={form.sessionsIncluded} onChange={e => setForm(p => ({ ...p, sessionsIncluded: e.target.value }))} placeholder="10" />
                  </div>
                  <div>
                    <Label>Valid (days)</Label>
                    <Input className="mt-1" type="number" value={form.validityDays} onChange={e => setForm(p => ({ ...p, validityDays: e.target.value }))} placeholder="90" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button className="bg-[#2b5069] hover:bg-[#1e3a4f]" onClick={handleCreate}>Create Package</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {pkgs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">No training packages yet</p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>Create Your First Package</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pkgs.map(pkg => {
              const perSession = pkg.sessionsIncluded > 0 ? euro(Math.round(pkg.price / pkg.sessionsIncluded)) : '-';
              return (
                <div key={pkg.id} className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                      <p className="text-xs text-gray-500">{pkg.sessionsIncluded} sessions &middot; {pkg.validityDays} days</p>
                    </div>
                    <Badge className={pkg.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}>
                      {pkg.status}
                    </Badge>
                  </div>
                  {pkg.description && <p className="text-sm text-gray-500 mb-4">{pkg.description}</p>}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-gray-900">{euro(pkg.price)}</span>
                    <span className="text-xs text-gray-400">{perSession}/session</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-50">
                    <div>
                      <p className="text-xs text-gray-400">Sold</p>
                      <p className="text-sm font-semibold text-gray-900">{pkg.totalSold}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Revenue</p>
                      <p className="text-sm font-semibold text-gray-900">{euro(pkg.revenue)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#2b5069] flex-1">
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#2b5069] flex-1">
                      <Send className="h-3.5 w-3.5 mr-1" /> Share
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // TAB: PAYMENTS
  // ============================================================================

  const PaymentsTab = () => {
    const statusStyles: Record<string, string> = {
      PAID: 'bg-emerald-50 text-emerald-700',
      PENDING: 'bg-amber-50 text-amber-700',
      FAILED: 'bg-red-50 text-red-700',
      REFUNDED: 'bg-blue-50 text-blue-700',
    };
    const statusIcons: Record<string, React.ReactNode> = {
      PAID: <CheckCircle className="h-4 w-4 text-emerald-500" />,
      PENDING: <Clock className="h-4 w-4 text-amber-500" />,
      FAILED: <AlertCircle className="h-4 w-4 text-red-500" />,
      REFUNDED: <RefreshCw className="h-4 w-4 text-blue-500" />,
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            <p className="text-sm text-gray-500">Track all incoming payments</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search payments..."
            className="flex-1"
            value={paymentFilters.search}
            onChange={e => setPaymentFilters(p => ({ ...p, search: e.target.value }))}
          />
          <Select value={paymentFilters.status} onValueChange={v => setPaymentFilters(p => ({ ...p, status: v }))}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilters.type} onValueChange={v => setPaymentFilters(p => ({ ...p, type: v }))}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="session">Session</SelectItem>
              <SelectItem value="package">Package</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment list */}
        <div className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-50 overflow-hidden">
          {paymentHistory.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No payments found</p>
            </div>
          ) : (
            paymentHistory.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {statusIcons[p.status] || statusIcons.PENDING}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.description}</p>
                    <p className="text-xs text-gray-400">{p.clientName} &middot; {p.type}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-gray-900">{euro(p.amount)}</p>
                  <div className="flex items-center gap-2 justify-end mt-0.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusStyles[p.status] || 'bg-gray-50 text-gray-500'}`}>
                      {p.status}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB: ANALYTICS
  // ============================================================================

  const AnalyticsTab = () => {
    if (!dashboardData) {
      return (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Analytics will appear once you start receiving payments.</p>
        </div>
      );
    }

    const a = dashboardData.paymentAnalytics;
    const successRate = a.totalPayments > 0 ? ((a.successfulPayments / a.totalPayments) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-gray-900">{a.totalPayments}</p>
            <p className="text-xs text-gray-500 mt-1">Total Payments</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-emerald-600">{a.successfulPayments}</p>
            <p className="text-xs text-gray-500 mt-1">Successful</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-red-500">{a.failedPayments}</p>
            <p className="text-xs text-gray-500 mt-1">Failed</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-blue-500">{a.refundedPayments}</p>
            <p className="text-xs text-gray-500 mt-1">Refunded</p>
          </div>
        </div>

        {/* Success rate + average */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Success Rate</h4>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-emerald-600">{successRate.toFixed(1)}%</span>
              <span className="text-sm text-gray-400 mb-1">of payments succeed</span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${successRate}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Average Payment</h4>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-gray-900">{euro(a.averagePaymentAmount)}</span>
              <span className="text-sm text-gray-400 mb-1">per transaction</span>
            </div>
          </div>
        </div>

        {/* Monthly trends */}
        {a.monthlyTrends.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trends</h4>
            <div className="flex items-end gap-1 h-32">
              {(() => {
                const max = Math.max(...a.monthlyTrends.map(t => t.revenue), 1);
                return a.monthlyTrends.map((t, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-[#2b5069]/80 hover:bg-[#2b5069] transition-colors min-h-[2px]"
                      style={{ height: `${(t.revenue / max) * 100}%` }}
                      title={`${t.month}: ${euro(t.revenue)}`}
                    />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">{t.month}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading && !dashboardData && !connectStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-[#2b5069]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connect Banner */}
      <ConnectBanner status={connectStatus} onRefresh={fetchConnectStatus} />

      {/* Header + period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business</h2>
          <p className="text-sm text-gray-500">Manage revenue, subscriptions, and packages</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => { fetchDashboardData(); fetchConnectStatus(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100/80 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Plans</TabsTrigger>
          <TabsTrigger value="packages" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Packages</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Payments</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="subscriptions" className="mt-6"><SubscriptionsTab /></TabsContent>
        <TabsContent value="packages" className="mt-6"><PackagesTab /></TabsContent>
        <TabsContent value="payments" className="mt-6"><PaymentsTab /></TabsContent>
        <TabsContent value="analytics" className="mt-6"><AnalyticsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
