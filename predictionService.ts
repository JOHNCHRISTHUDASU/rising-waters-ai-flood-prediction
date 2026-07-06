import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
  type MouseEvent,
} from 'react';

interface RouterContextValue {
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function getPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) return hash;
  return window.location.pathname || '/';
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(getPath());

  useEffect(() => {
    const onPop = () => setPath(getPath());
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    if (opts?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useNavigate must be used within BrowserRouter');
  return ctx.navigate;
}

export function useLocationPath() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useLocationPath must be used within BrowserRouter');
  return ctx.path;
}

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    const ap = pathParts[i];
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(ap);
    } else if (pp !== ap) {
      return null;
    }
  }
  return params;
}

export function Routes({ children }: { children: ReactNode }) {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('Routes must be used within BrowserRouter');

  const routes: { path: string; element: ReactNode }[] = [];
  const childArray = Array.isArray(children) ? children : [children];
  for (const child of childArray) {
    if (child && typeof child === 'object' && 'props' in child) {
      const props = (child as { props: { path: string; element: ReactNode } }).props;
      if (props.path && props.element) {
        routes.push({ path: props.path, element: props.element });
      }
    }
  }

  for (const route of routes) {
    const params = matchPath(route.path, ctx.path);
    if (params) {
      return <>{route.element}</>;
    }
  }

  return null;
}

export function Route({ element }: { path: string; element: ReactNode }) {
  return <>{element}</>;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('Navigate must be used within BrowserRouter');
  useEffect(() => {
    ctx.navigate(to, { replace });
  }, [to, replace, ctx]);
  return null;
}

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string | ((props: { isActive: boolean }) => string);
  onClick?: () => void;
}

export function Link({ to, children, className, onClick }: LinkProps) {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('Link must be used within BrowserRouter');

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.();
    ctx.navigate(to);
  };

  const cls = typeof className === 'function' ? className({ isActive: ctx.path === to }) : className;

  return (
    <a href={to} onClick={handleClick} className={cls}>
      {children}
    </a>
  );
}

interface NavLinkProps {
  to: string;
  children?: ReactNode | ((props: { isActive: boolean }) => ReactNode);
  className?: string | ((props: { isActive: boolean }) => string);
  onClick?: () => void;
}

export function NavLink({ to, children, className, onClick }: NavLinkProps) {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('NavLink must be used within BrowserRouter');

  const isActive = ctx.path === to;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.();
    ctx.navigate(to);
  };

  const cls = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <a href={to} onClick={handleClick} className={cls}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </a>
  );
}
