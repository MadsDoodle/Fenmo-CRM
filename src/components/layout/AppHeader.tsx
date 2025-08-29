import { useEffect, useRef, useState } from "react";
import { Search, Bell, User, Settings, Moon, Sun, Loader2, ArrowRight, Menu } from "lucide-react";
import { NotificationBell } from "@/components/ui/notification-bell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    master: Array<{ id: string; name: string; email: string | null; company: string | null; outreach_status: string | null }>;
    messages: Array<{ id: string; subject: string | null; content: string }>;
    tasks: Array<{ id: string; title: string; description: string | null }>;
  }>({ master: [], messages: [], tasks: [] });
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults({ master: [], messages: [], tasks: [] });
      setShowResults(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);

    const run = async () => {
      try {
        const [m1, m2, m3] = await Promise.all([
          supabase
            .from('master')
            .select('id, name, email, company, outreach_status')
            .or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('messages')
            .select('id, subject, content')
            .or(`subject.ilike.%${q}%,content.ilike.%${q}%`)
            .limit(5),
          supabase
            .from('tasks')
            .select('id, title, description')
            .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
            .limit(5)
        ]);

        if (cancelled) return;

        const master = (m1.data || []) as any[];
        const messages = (m2.data || []) as any[];
        const tasks = (m3.data || []) as any[];
        setResults({ master, messages, tasks });
        setShowResults(true);
      } catch (e) {
        // Swallow errors in search panel
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    const t = setTimeout(run, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchQuery]);

  const toggleMobileSidebar = () => {
    const overlay = document.getElementById('mobile-sidebar-overlay');
    if (overlay) {
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    }
  };

  return (
    <header className="h-16 border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileSidebar}
          className="md:hidden w-9 h-9 p-0 hover:bg-accent/80"
        >
          <Menu className="w-4 h-4" />
        </Button>
        
        {/* Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-md ml-4 md:ml-0" ref={searchContainerRef}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search contacts, messages, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/60 focus:border-primary/60 transition-all duration-200"
            />
            {showResults && (
              <div className="absolute z-50 mt-2 w-full rounded-md border border-border/50 bg-card/95 backdrop-blur-md shadow-xl">
                <div className="p-2 border-b border-border/40 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Search results</div>
                  {isSearching && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                  <SearchSection
                    title="Master Table"
                    items={results.master.map(r => ({
                      id: r.id,
                      primary: r.name,
                      secondary: r.company || r.email || '',
                      onClick: () => navigate(`/master-table?q=${encodeURIComponent(searchQuery)}`)
                    }))}
                    onViewAll={() => navigate(`/master-table?q=${encodeURIComponent(searchQuery)}`)}
                  />
                  <SearchSection
                    title="Messages"
                    items={results.messages.map(r => ({
                      id: r.id,
                      primary: r.subject || r.content.slice(0, 40),
                      secondary: r.content.slice(0, 80),
                      onClick: () => navigate(`/messaging`)
                    }))}
                    onViewAll={() => navigate(`/messaging`)}
                  />
                  <SearchSection
                    title="Tasks"
                    items={results.tasks.map(r => ({
                      id: r.id,
                      primary: r.title,
                      secondary: r.description || '',
                      onClick: () => navigate(`/tasks`)
                    }))}
                    onViewAll={() => navigate(`/tasks`)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 p-0 hover:bg-accent/80"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-accent/80">
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold">
                    MSB
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-sm border-border/60">
              <div className="p-3 border-b border-border/40">
                <p className="text-sm font-medium">Madhav S Badiya</p>
                <p className="text-xs text-muted-foreground">madhav.badiya@example.com</p>
              </div>
              <DropdownMenuItem className="cursor-pointer hover:bg-accent/50">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-accent/50" onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function SearchSection({
  title,
  items,
  onViewAll
}: {
  title: string;
  items: Array<{ id: string; primary: string; secondary?: string; onClick: () => void }>;
  onViewAll: () => void;
}) {
  return (
    <div className="p-2">
      <div className="px-1 pb-2 flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        <button onClick={onViewAll} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground px-1 py-2">No matches</div>
      ) : (
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item.id}>
              <button onClick={item.onClick} className="w-full text-left px-2 py-2 rounded hover:bg-accent/50">
                <div className="text-sm text-foreground line-clamp-1">{item.primary}</div>
                {item.secondary && (
                  <div className="text-xs text-muted-foreground line-clamp-1">{item.secondary}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}