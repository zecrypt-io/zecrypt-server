'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Lock, 
  TrendingUp, 
  Users, 
  Shield, 
  FileText
} from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";

export function LocalizedOverviewContent() {
  // Use our custom translation hook
  const { translate } = useTranslator();
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{translate('dashboard', 'navigation')}</h1>
          <p className="text-muted-foreground">{translate('welcome_back', 'dashboard')}</p>
        </div>
        <div>
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option>{translate('today', 'time')}</option>
            <option>{translate('last_7_days', 'time')}</option>
            <option>{translate('last_30_days', 'time')}</option>
            <option>{translate('all_time', 'time')}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate('total_passwords', 'dashboard')}
              </CardTitle>
              <Lock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">124</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+12%</span> {translate('from_last_month', 'dashboard')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate('total_accounts', 'dashboard')}
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">34</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+5%</span> {translate('from_last_month', 'dashboard')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate('total_folders', 'dashboard')}
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+2%</span> {translate('from_last_month', 'dashboard')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{translate('recent_activity', 'dashboard')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {i % 2 === 0 ? (
                      <Lock className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {i % 2 === 0 
                          ? translate('password_updated', 'activity')
                          : translate('note_created', 'activity')}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {i === 1 
                          ? translate('just_now', 'time')
                          : i === 2 
                            ? translate('hours_ago', 'time', { hours: 2 })
                            : i === 3 
                              ? translate('yesterday', 'time')
                              : translate('days_ago', 'time', { days: 3 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 