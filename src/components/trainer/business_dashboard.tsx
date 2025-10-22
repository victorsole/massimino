// src/components/trainer/business_dashboard.tsx

'use client'

/**
 * Business Dashboard Component
 * Comprehensive trainer business interface for revenue analytics, subscription management,
 * package deals, client billing, payment history, and earnings overview
 */

import React, { useState, useEffect } from 'react';
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
  Activity, AlertCircle, CheckCircle,
  Clock, Filter, FileText, Mail
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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
    paymentMethods: Array<{ method: string; count: number; }>;
    monthlyTrends: Array<{ month: string; revenue: number; }>;
    clientAnalytics: Array<{ clientId: string; totalPaid: number; sessionsCount: number; }>;
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
// MAIN COMPONENT
// ============================================================================

export default function BusinessDashboard() {
  const [dashboardData, setDashboardData] = useState<BusinessDashboardData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentFilters, setPaymentFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/trainer?action=dashboard&period=${period}`);
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        console.error('Failed to fetch dashboard data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const params = new URLSearchParams({
        action: 'payments',
        ...(paymentFilters.status && { status: paymentFilters.status }),
        ...(paymentFilters.type && { type: paymentFilters.type })
      });

      const response = await fetch(`/api/payments/trainer?${params}`);
      const result = await response.json();

      if (result.success) {
        setPaymentHistory(result.data.payments);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPaymentHistory();
    }
  }, [activeTab, paymentFilters]);

  // ============================================================================
  // REVENUE OVERVIEW COMPONENT
  // ============================================================================

  const RevenueOverview = () => {
    if (!dashboardData) return <div>Loading revenue data...</div>;

    const { revenueMetrics } = dashboardData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(revenueMetrics.totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={revenueMetrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {revenueMetrics.growth >= 0 ? '+' : ''}{revenueMetrics.growth.toFixed(1)}%
              </span> from last {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(revenueMetrics.netEarnings / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              After €{(revenueMetrics.commission / 100).toFixed(2)} platform fee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueMetrics.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              €{(revenueMetrics.subscriptionsRevenue / 100).toFixed(2)} recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Session</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(revenueMetrics.averageSessionPrice / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueMetrics.totalSessions} sessions completed
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT COMPONENT
  // ============================================================================

  const SubscriptionManagement = () => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newSubscription, setNewSubscription] = useState({
      name: '',
      description: '',
      price: '',
      interval: 'monthly',
      features: ['']
    });

    const handleCreateSubscription = async () => {
      try {
        const response = await fetch('/api/payments/trainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-subscription',
            ...newSubscription,
            price: parseInt(newSubscription.price) * 100,
            features: newSubscription.features.filter(f => f.trim())
          })
        });

        const result = await response.json();
        if (result.success) {
          setShowCreateDialog(false);
          setNewSubscription({ name: '', description: '', price: '', interval: 'monthly', features: [''] });
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error creating subscription:', error);
      }
    };

    const addFeature = () => {
      setNewSubscription(prev => ({
        ...prev,
        features: [...prev.features, '']
      }));
    };

    const updateFeature = (index: number, value: string) => {
      setNewSubscription(prev => ({
        ...prev,
        features: prev.features.map((f, i) => i === index ? value : f)
      }));
    };

    const removeFeature = (index: number) => {
      setNewSubscription(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index)
      }));
    };

    if (!dashboardData) return <div>Loading subscriptions...</div>;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Subscription Plans</h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Subscription Plan</DialogTitle>
                <DialogDescription>
                  Create a new recurring subscription plan for your athletes
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sub-name" className="text-right">Name</Label>
                  <Input
                    id="sub-name"
                    className="col-span-3"
                    value={newSubscription.name}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Premium Training Plan"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sub-desc" className="text-right">Description</Label>
                  <Textarea
                    id="sub-desc"
                    className="col-span-3"
                    value={newSubscription.description}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Comprehensive training with nutrition guidance"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sub-price" className="text-right">Price (€)</Label>
                  <Input
                    id="sub-price"
                    type="number"
                    className="col-span-3"
                    value={newSubscription.price}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="99"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sub-interval" className="text-right">Interval</Label>
                  <Select value={newSubscription.interval} onValueChange={(value) => setNewSubscription(prev => ({ ...prev, interval: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">Features</Label>
                  <div className="col-span-3 space-y-2">
                    {newSubscription.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Feature description"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubscription}>
                  Create Subscription
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {dashboardData.subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{subscription.name}</CardTitle>
                    <CardDescription>
                      €{(subscription.price / 100).toFixed(2)} per {subscription.interval}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {subscription.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Features</p>
                    <ul className="text-sm space-y-1">
                      {subscription.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Subscribers</p>
                    <p className="text-2xl font-bold">{subscription.activeSubscribers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {dashboardData.subscriptions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No subscription plans yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // PACKAGE DEALS COMPONENT
  // ============================================================================

  const PackageDeals = () => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newPackage, setNewPackage] = useState({
      name: '',
      description: '',
      price: '',
      sessionsIncluded: '',
      validityDays: '90',
      features: ['']
    });

    const handleCreatePackage = async () => {
      try {
        const response = await fetch('/api/payments/trainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-package',
            ...newPackage,
            price: parseInt(newPackage.price) * 100,
            sessionsIncluded: parseInt(newPackage.sessionsIncluded),
            validityDays: parseInt(newPackage.validityDays),
            features: newPackage.features.filter(f => f.trim())
          })
        });

        const result = await response.json();
        if (result.success) {
          setShowCreateDialog(false);
          setNewPackage({ name: '', description: '', price: '', sessionsIncluded: '', validityDays: '90', features: [''] });
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error creating package:', error);
      }
    };

    if (!dashboardData) return <div>Loading packages...</div>;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Training Packages</h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Training Package</DialogTitle>
                <DialogDescription>
                  Create a package deal with multiple sessions
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pkg-name" className="text-right">Name</Label>
                  <Input
                    id="pkg-name"
                    className="col-span-3"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="10-Session Package"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pkg-desc" className="text-right">Description</Label>
                  <Textarea
                    id="pkg-desc"
                    className="col-span-3"
                    value={newPackage.description}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Perfect for committed athletes"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pkg-price" className="text-right">Price (€)</Label>
                  <Input
                    id="pkg-price"
                    type="number"
                    className="col-span-3"
                    value={newPackage.price}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="500"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pkg-sessions" className="text-right">Sessions</Label>
                  <Input
                    id="pkg-sessions"
                    type="number"
                    className="col-span-3"
                    value={newPackage.sessionsIncluded}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, sessionsIncluded: e.target.value }))}
                    placeholder="10"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pkg-validity" className="text-right">Valid for (days)</Label>
                  <Input
                    id="pkg-validity"
                    type="number"
                    className="col-span-3"
                    value={newPackage.validityDays}
                    onChange={(e) => setNewPackage(prev => ({ ...prev, validityDays: e.target.value }))}
                    placeholder="90"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePackage}>
                  Create Package
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {dashboardData.packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription>
                      {pkg.sessionsIncluded} sessions • Valid for {pkg.validityDays} days
                    </CardDescription>
                  </div>
                  <Badge variant={pkg.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {pkg.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">€{(pkg.price / 100).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">
                      €{((pkg.price / 100) / pkg.sessionsIncluded).toFixed(2)} per session
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Sold</p>
                      <p className="font-medium">{pkg.totalSold}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-medium">€{(pkg.revenue / 100).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {dashboardData.packages.length === 0 && (
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No training packages yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create Your First Package
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // PAYMENT HISTORY COMPONENT
  // ============================================================================

  const PaymentHistory = () => {
    const getStatusBadge = (status: string) => {
      const variants = {
        'PAID': 'default',
        'PENDING': 'secondary',
        'FAILED': 'destructive',
        'REFUNDED': 'outline'
      } as const;

      return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'PAID': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'FAILED': return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'REFUNDED': return <RefreshCw className="h-4 w-4 text-blue-500" />;
        default: return <Clock className="h-4 w-4 text-gray-500" />;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Payment History</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search payments..."
              value={paymentFilters.search}
              onChange={(e) => setPaymentFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Select value={paymentFilters.status} onValueChange={(value) => setPaymentFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilters.type} onValueChange={(value) => setPaymentFilters(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="session">Session</SelectItem>
              <SelectItem value="package">Package</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {paymentHistory.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.clientName} • {payment.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{(payment.amount / 100).toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(payment.status)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {paymentHistory.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payment history yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your training business, track revenue, and grow your athlete base
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RevenueOverview />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData && (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Sessions</span>
                      <span>€{(dashboardData.revenueMetrics.sessionsRevenue / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Packages</span>
                      <span>€{(dashboardData.revenueMetrics.packagesRevenue / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subscriptions</span>
                      <span>€{(dashboardData.revenueMetrics.subscriptionsRevenue / 100).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('subscriptions')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Plan
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('packages')}>
                    <Package className="h-4 w-4 mr-2" />
                    New Package
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invoice
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="packages">
          <PackageDeals />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentHistory />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>Detailed insights into your payment performance</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{dashboardData.paymentAnalytics.totalPayments}</p>
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{dashboardData.paymentAnalytics.successfulPayments}</p>
                      <p className="text-sm text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{dashboardData.paymentAnalytics.failedPayments}</p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{dashboardData.paymentAnalytics.refundedPayments}</p>
                      <p className="text-sm text-muted-foreground">Refunded</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData && (
                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-600">
                        {((dashboardData.paymentAnalytics.successfulPayments / dashboardData.paymentAnalytics.totalPayments) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Payment success rate</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData && (
                    <div className="text-center">
                      <p className="text-4xl font-bold">
                        €{(dashboardData.paymentAnalytics.averagePaymentAmount / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">Average payment amount</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
