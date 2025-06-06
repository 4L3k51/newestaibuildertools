"use client";

import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from 'date-fns';
import type { TooltipProps } from 'recharts';

const ROWS_OPTIONS = [10, 20, 30, 40, 50];

const TIME_RANGES = [
  { label: "Last 3 months", value: 90 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 7 days", value: 7 },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatChartDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'MMM d');
  } catch {
    return dateString;
  }
}

function getRangeLabel(days: number) {
  if (days === 90) return "the last 3 months";
  if (days === 30) return "the last 30 days";
  if (days === 7) return "the last 7 days";
  return "";
}

type Topic = string | { name: string };

type ToolRow = {
  id: string;
  name: string;
  tagline: string;
  topics: Topic[];
  thumbnail_url: string;
  website: string;
  created_at: string;
  score: number | null;
};

function CustomTooltip({ active, payload, label }: TooltipProps<any, any>) {
  if (!active || !payload || !payload.length) return null;
  const value = (payload[0] && typeof payload[0].value === 'number') ? payload[0].value : '';
  return (
    <div className="rounded-lg bg-white shadow-lg px-4 py-2 text-sm border border-border">
      <div className="font-semibold mb-1 text-foreground">{formatChartDate(label as string)}</div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-black mr-2" />
        <span className="text-muted-foreground">Tools Published:</span>
        <span className="font-bold text-foreground ml-1">{value}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [chartRange, setChartRange] = useState(90);
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setTableError(null);
    const fetchData = async () => {
      try {
        const res = await fetch('/api/similar-tools');
        if (!res.ok) throw new Error('Failed to fetch tools');
        const data = await res.json();
        // Pagination logic (client-side)
        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage;
        const paginated = data.slice(from, to);
        setTools(paginated);
        setTotal(data.length);
      } catch (err: any) {
        setTableError(err.message || 'Error loading tools');
        setTools([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, rowsPerPage]);

  useEffect(() => {
    setChartLoading(true);
    setChartError(null);
    const fetchChartData = async () => {
      try {
        const res = await fetch('/api/similar-tools');
        if (!res.ok) throw new Error('Failed to fetch tools for chart');
        const data = await res.json();
        // Group by date for chart
        const since = new Date();
        since.setDate(since.getDate() - chartRange);
        const sinceStr = since.toISOString().split('T')[0];
        const filtered = data.filter((tool: ToolRow) => tool.created_at >= sinceStr);
        const dateCounts: Record<string, number> = {};
        filtered.forEach((tool: ToolRow) => {
          const date = tool.created_at.split('T')[0];
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        });
        const chartArr = Object.entries(dateCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count }));
        setChartData(chartArr);
      } catch (err: any) {
        setChartError(err.message || 'Error loading chart data');
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChartData();
  }, [chartRange]);

  const totalPages = Math.ceil(total / rowsPerPage) || 1;

  // Smooth scroll handler
  const scrollToSection = (sectionId: string) => {
    if (typeof window !== 'undefined') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-4 px-1">
      {/* Hero Section */}
      <section className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center pt-8 pb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Newest AI Builder Tools</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-6">
          A curated collection of AI tools with expert ratings and reviews. Find the perfect tool for your next project.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="px-7" onClick={() => scrollToSection('tools')}>
            Browse Tools
          </Button>
          <Button variant="outline" size="lg" className="px-7" onClick={() => scrollToSection('analytics')}>
            View Analytics
          </Button>
        </div>
      </section>
      {/* Chart Card */}
      <Card id="analytics" className="w-full max-w-6xl mb-4">
        <CardContent className="p-3">
          {/* Chart loading and error states */}
          {chartLoading && (
            <div className="flex items-center justify-center h-[120px] text-muted-foreground text-xs">Loading chart...</div>
          )}
          {chartError && (
            <div className="flex items-center justify-center h-[120px] text-destructive text-xs">Error: {chartError}</div>
          )}
          {!chartLoading && !chartError && (
            <>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-base font-bold">Tools Published</div>
                  <div className="text-muted-foreground text-xs">Total for {getRangeLabel(chartRange)}</div>
                </div>
                <div className="flex gap-1">
                  {TIME_RANGES.map((range) => (
                    <Button
                      key={range.value}
                      variant={chartRange === range.value ? "secondary" : "ghost"}
                      className="rounded-full px-2 py-0.5 text-xs h-7 min-w-[80px]"
                      onClick={() => setChartRange(range.value)}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTools" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#000" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#000" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatChartDate} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} height={18} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Area type="monotone" dataKey="count" stroke="#000" fill="url(#colorTools)" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#000' }} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
      {/* Table Card */}
      <div id="tools" className="w-full max-w-6xl rounded-xl bg-card border border-border shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/80 h-8">
              <TableHead className="px-3 py-2" />
              <TableHead className="text-sm font-bold px-3 py-2">Name</TableHead>
              <TableHead className="text-sm font-bold px-3 py-2">Topics</TableHead>
              <TableHead className="text-sm font-bold px-3 py-2">Aleksi&apos;s Score</TableHead>
              <TableHead className="text-sm font-bold px-3 py-2">Visit Website</TableHead>
              <TableHead className="text-sm font-bold px-3 py-2">Date Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-xs">Loading...</TableCell>
              </TableRow>
            ) : tableError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-xs">{tableError}</TableCell>
              </TableRow>
            ) : tools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-xs">No tools found.</TableCell>
              </TableRow>
            ) : (
              tools.map((tool) => (
                <TableRow key={tool.id} className="border-b border-muted hover:bg-muted/60 transition-colors group h-8">
                  <TableCell className="px-3 py-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={tool.thumbnail_url} alt={tool.name} />
                      <AvatarFallback>{tool.name[0]}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="px-3 py-2 font-normal text-xs">
                    <div className="font-extrabold text-sm leading-tight text-foreground">
                      <a href={tool.website ? tool.website.split('?')[0] : '#'} target="_blank" rel="noopener noreferrer" className="hover:underline focus:underline outline-none">
                        {tool.name}
                      </a>
                    </div>
                    <div className="text-muted-foreground text-[11px] mt-0.5 font-normal">{tool.tagline}</div>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(tool.topics)
                        ? tool.topics.map((topic: Topic, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground text-[11px] font-normal rounded-full px-2 py-0.5">
                              {typeof topic === 'string' ? topic : topic.name}
                            </Badge>
                          ))
                        : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {tool.score === null || tool.score === undefined ? (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium px-2 py-0.5 text-[11px] rounded-full flex items-center gap-1 min-w-[80px] justify-center">
                        <Loader2 className="w-3 h-3 animate-spin mr-1 text-muted-foreground" />
                        Not tried yet
                      </Badge>
                    ) : tool.score >= 8 ? (
                      <Badge variant="secondary" className="bg-emerald-500 text-white font-medium px-2 py-0.5 text-[11px] rounded-full flex items-center gap-1 min-w-[50px] justify-center">
                        <Check className="w-3 h-3 mr-1 text-emerald-200" />
                        Great!
                      </Badge>
                    ) : tool.score >= 6.5 ? (
                      <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 font-medium px-2 py-0.5 text-[11px] rounded-full flex items-center gap-1 min-w-[65px] justify-center">
                        <Check className="w-3 h-3 mr-1 text-yellow-900" />
                        Pretty good
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-pink-500 text-white font-medium px-2 py-0.5 text-[11px] rounded-full flex items-center gap-1 min-w-[40px] justify-center">
                        <Check className="w-3 h-3 mr-1 text-pink-200" />
                        meh..
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Button asChild variant="secondary" size="sm" className="rounded-full px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 h-7 min-w-[80px]">
                      <a href={tool.website ? tool.website.split('?')[0] : '#'} target="_blank" rel="noopener noreferrer">
                        Visit Website <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-[11px] text-muted-foreground">
                    {formatDate(tool.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* Pagination bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-card px-2 py-2 border-t border-border">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Rows per page</span>
              <Select value={rowsPerPage.toString()} onValueChange={val => { setRowsPerPage(Number(val)); setPage(1); }}>
                <SelectTrigger className="w-[48px] h-6 px-1 py-0 text-xs bg-muted border border-border rounded focus:outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="bg-muted border border-border rounded-xl shadow-lg text-xs">
                  {ROWS_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt.toString()} className="h-6 text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setPage(1)} disabled={page === 1} aria-label="First page" className="rounded-md w-6 h-6 p-0 text-xs">
                {'<<'}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page" className="rounded-md w-6 h-6 p-0 text-xs">
                {'<'}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} aria-label="Next page" className="rounded-md w-6 h-6 p-0 text-xs">
                {'>'}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0} aria-label="Last page" className="rounded-md w-6 h-6 p-0 text-xs">
                {'>>'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

