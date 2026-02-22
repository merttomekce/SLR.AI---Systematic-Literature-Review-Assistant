'use client';

import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReviewStore } from '@/store/useReviewStore';
import { exportToExcel } from '@/lib/fileParser';

export default function QualityGatePage() {
  const router = useRouter();
  const { currentS1Run, saveCurrentS1Run, startS2Run } = useReviewStore();

  const stats = currentS1Run?.stats || { total: 0, included: 0, excluded: 0, notAccessible: 0 };
  const pending = currentS1Run ? Object.values(currentS1Run.papers).filter(p => p.s1Decision === 'PENDING' || !p.s1Decision).length : 0;

  const totalProcessed = stats.included + stats.excluded + stats.notAccessible;
  const inclusionRate = stats.total > 0 ? ((stats.included / stats.total) * 100).toFixed(1) : '0.0';
  const exclusionRate = stats.total > 0 ? ((stats.excluded / stats.total) * 100).toFixed(1) : '0.0';

  const handleExport = () => {
    if (!currentS1Run) return;
    const papers = Object.values(currentS1Run.papers).map(p => ({
      ID: p.id,
      Title: p.title,
      Authors: p.author || '',
      Year: p.year || '',
      Journal: p.journal || '',
      DOI: p.doi || '',
      Abstract: p.abstract || '',
      Step1_Decision: p.s1Decision || 'PENDING',
      Step1_Reason: p.s1Reason || '',
      Step1_Confidence: p.s1Confidence || ''
    }));

    const summary = [{
      Run_Name: currentS1Run.name,
      Model: currentS1Run.model,
      Total_Papers: stats.total,
      Included: stats.included,
      Excluded: stats.excluded,
      Not_Accessible: stats.notAccessible,
      Pending: pending
    }];

    exportToExcel([
      { name: 'S1 Results', data: papers },
      { name: 'Summary', data: summary }
    ], `SLR_AI_Step1_${currentS1Run.name || 'Export'}.xlsx`);
  };

  const handleProceed = () => {
    if (currentS1Run) {
      saveCurrentS1Run();
      startS2Run(currentS1Run.id);
      router.push('/review/fulltext');
    }
  };

  const isComplete = pending === 0 && stats.total > 0;

  const qualityMetrics = [
    {
      title: 'Inclusion Rate',
      value: `${inclusionRate}%`,
      status: 'good',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      title: 'Studies Included',
      value: stats.included.toString(),
      status: 'good',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      title: 'Studies Excluded',
      value: stats.excluded.toString(),
      status: 'good',
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      title: 'Studies Pending',
      value: pending.toString(),
      status: pending === 0 ? 'good' : 'warning',
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  const decisionBreakdown = [
    {
      label: 'Included',
      count: stats.included,
      percentage: Number(inclusionRate),
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      icon: <CheckCircle2 className="w-6 h-6" />,
    },
    {
      label: 'Excluded',
      count: stats.excluded,
      percentage: Number(exclusionRate),
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      icon: <AlertCircle className="w-6 h-6" />,
    },
  ];

  const qualityChecks = [
    {
      name: 'Completeness Check',
      status: isComplete ? ('passed' as const) : ('warning' as const),
      detail: isComplete ? 'All papers screened' : `${pending} papers still pending review`,
    },
    {
      name: 'Accessibility',
      status: stats.notAccessible > 0 ? ('warning' as const) : ('passed' as const),
      detail: `${stats.notAccessible} papers marked as not accessible`,
    }
  ];

  return (
    <LayoutWrapper
      headerTitle="Gate: Step 1 Complete"
      headerDescription="Review abstract screening results before full-text extraction"
    >
      <div className="p-6 space-y-8 animate-in fade-in duration-500">
        {!currentS1Run && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-600 mb-6">
            No active Step 1 run found. Go back to Setup to start a new review.
          </div>
        )}

        {/* Quality Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {qualityMetrics.map((metric, idx) => (
            <Card
              key={metric.title}
              className="p-6 border-border animate-in fade-in duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {metric.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {metric.value}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg ${metric.status === 'good'
                      ? 'bg-green-500/10 text-green-600'
                      : metric.status === 'warning'
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}
                >
                  {metric.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Decision Breakdown */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-6 border-border space-y-6">
              <h3 className="text-lg font-semibold text-foreground">
                Decision Summary
              </h3>

              <div className="space-y-4">
                {decisionBreakdown.map((card) => (
                  <div key={card.label} className={`p-4 rounded-lg ${card.bgColor}`}>
                    <div className="flex items-start gap-3">
                      <div className={card.color}>{card.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{card.label}</p>
                        <p className="text-2xl font-bold text-foreground">
                          {card.count}
                        </p>
                        <p className={`text-xs font-medium ${card.color}`}>
                          {card.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Visualization */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Distribution (Processed)
                </p>
                <div className="flex h-8 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-green-600"
                    style={{ width: `${inclusionRate}%` }}
                  />
                  <div
                    className="bg-red-600"
                    style={{ width: `${exclusionRate}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Export & Continue */}
            <Card className="p-6 border-border bg-secondary/20 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Data Export
              </p>
              <div className="space-y-4 text-sm">
                <p className="text-foreground">
                  Export Step 1 results to Excel for your PRISMA flowchart and audit trail.
                </p>
                <Button
                  onClick={handleExport}
                  disabled={!currentS1Run}
                  variant="outline"
                  className="w-full gap-2 border-border hover:bg-secondary"
                >
                  <Download className="w-4 h-4" />
                  Export S1 Excel
                </Button>
              </div>
            </Card>
          </div>

          {/* Quality Checks */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 border-border space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Pre-Flight Checks
                </h3>
                <Badge className={isComplete ? "bg-green-500/20 text-green-600 border-green-200" : "bg-yellow-500/20 text-yellow-600 border-yellow-200"}>
                  {isComplete ? 'All clear' : 'Action Required'}
                </Badge>
              </div>

              <div className="space-y-3">
                {qualityChecks.map((check, idx) => (
                  <div
                    key={check.name}
                    className="p-4 rounded-lg border border-border hover:border-primary/30 transition-smooth animate-in fade-in duration-500"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {check.status === 'passed' ? (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{check.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {check.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommendations */}
            {!isComplete && (
              <Card className="p-6 border-border bg-blue-500/5 border-blue-200/30 space-y-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground mb-2">
                      Recommendation
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      You still have pending papers. Consider going back to the Screening view and resuming the run, or applying manual overrides before proceeding.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Link href="/review/screening">
            <Button variant="outline" className="border-border hover:bg-secondary">
              Back to Screening
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              onClick={handleProceed}
              disabled={!currentS1Run || stats.included === 0}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md disabled:opacity-50"
            >
              Proceed to Full-Text Review
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
