import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  MessageSquare, 
  Database,
  Settings,
  HelpCircle,
  Target,
  Menu,
  Search,
  Loader2,
  ArrowRight,
  User,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/ui/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Configurations", url: "/messaging", icon: MessageSquare },
  { title: "Master Table", url: "/master-table", icon: Database, special: true },
];

const secondaryItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

export function TopNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    master: Array<{ id: string; name: string; email: string | null; company: string | null; outreach_status: string | null }>;
    messages: Array<{ id: string; subject: string | null; content: string }>;
    tasks: Array<{ id: string; title: string; description: string | null }>;
  }>({ master: [], messages: [], tasks: [] });
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  // Search functionality from AppHeader
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

  const getNavClasses = (path: string, isMobile = false) => {
    const baseClasses = isMobile 
      ? "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-accent/50 w-full text-left whitespace-nowrap"
      : "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-accent/50 whitespace-nowrap";
    
    return isActive(path) 
      ? `${baseClasses} bg-primary/10 text-primary font-medium`
      : `${baseClasses} text-muted-foreground hover:text-foreground`;
  };

  const NavItems = ({ isMobile = false, onItemClick }: { isMobile?: boolean; onItemClick?: () => void }) => (
    <>
      {navigationItems.map((item) => (
        <NavLink
          key={item.title}
          to={item.url}
          className={cn(
            getNavClasses(item.url, isMobile),
            item.special && "glassmorphism-button"
          )}
          onClick={onItemClick}
          aria-label={item.title}
        >
          <item.icon className={cn(
            "transition-colors",
            isActive(item.url) ? "text-primary" : "text-muted-foreground",
            isMobile ? "w-5 h-5" : "w-4 h-4"
          )} />
          {(isMobile || item.title !== "Home") && (
            <span className={cn(isMobile ? "text-base" : "text-sm font-medium", "whitespace-nowrap")}> 
              {item.title}
            </span>
          )}
        </NavLink>
      ))}
      
      <div className={cn("border-l border-border/40 h-6", isMobile && "hidden")} />
      
      {secondaryItems.map((item) => (
        <NavLink
          key={item.title}
          to={item.url}
          className={getNavClasses(item.url, isMobile)}
          onClick={onItemClick}
        >
          <item.icon className={cn(
            "transition-colors",
            isActive(item.url) ? "text-primary" : "text-muted-foreground",
            isMobile ? "w-5 h-5" : "w-4 h-4"
          )} />
          <span className={isMobile ? "text-base" : "text-sm font-medium"}>
            {item.title}
          </span>
        </NavLink>
      ))}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft">
              <Target className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-lg font-bold text-foreground">OutreachCRM</h1>
              <p className="text-xs text-muted-foreground">Orchestration Hub</p>
            </div>
          </div>

          {/* Centered Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-2">
            <NavItems />
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4 max-w-xs" ref={searchContainerRef}>
            <div className="relative flex-1">
              <div className={cn(
                "flex items-center transition-all duration-300 ease-in-out",
                isSearchExpanded ? "w-full" : "w-10"
              )}>
                {isSearchExpanded ? (
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search contacts, messages, tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50 border-border/60 focus:border-primary/60 transition-all duration-200"
                      onBlur={() => {
                        if (!searchQuery) {
                          setIsSearchExpanded(false);
                        }
                      }}
                      autoFocus
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => {
                          setSearchQuery("");
                          setIsSearchExpanded(false);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
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
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 p-0 hover:bg-accent/50"
                    onClick={() => setIsSearchExpanded(true)}
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
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

          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden w-10 h-10 p-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex items-center gap-3 px-4 pb-4 border-b border-border/40">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft">
                    <Target className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-foreground">OutreachCRM</h1>
                    <p className="text-xs text-muted-foreground">Orchestration Hub</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 px-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Main
                  </h3>
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={cn(
                        getNavClasses(item.url, true),
                        item.special && "glassmorphism-button"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className={cn(
                        "transition-colors w-5 h-5",
                        isActive(item.url) ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-base font-medium">{item.title}</span>
                    </NavLink>
                  ))}
                </div>

                <div className="flex flex-col gap-2 px-4 mt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Support
                  </h3>
                  {secondaryItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={getNavClasses(item.url, true)}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className={cn(
                        "transition-colors w-5 h-5",
                        isActive(item.url) ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-base font-medium">{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
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
