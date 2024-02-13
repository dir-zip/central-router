import React from "react";
import { Metadata } from "next";
import { NextRequest } from 'next/server'

export type RouteType = "page" | "api:GET" | "api:POST" | "api:PUT" | "api:DELETE" | "api:PATCH"

export type RouteMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

export type RouteHandler<T extends RouteParams<string>> = (params: T, request: NextRequest | null) => Promise<React.ReactElement | Response>;
export type MetadataHandler<T extends RouteParams<string>> = (params: T) => Promise<Metadata>;

export type RouteParams<Path extends string> = Path extends `${infer Segment}/${infer Rest}`
  ? Segment extends `:${infer Param}`
  ? { [K in Param]: string } & RouteParams<Rest>
  : RouteParams<Rest>
  : Path extends `:${infer Param}`
  ? { [K in Param]: string }
  : Record<string, string>;

interface Route<Path extends string> {
  path: Path;
  handler: RouteHandler<RouteParams<Path>>;
  hasParams: boolean;
  priority: number;
  type?: RouteType;
  metadata?: MetadataHandler<RouteParams<Path>>;
  method?: RouteMethods | string | null
}
type LayoutHandler = ({ children, route }: { children: React.ReactNode, route: string }) => Promise<React.ReactElement>

interface Layout<Path extends string> {
  path: Path;
  handler: LayoutHandler
  priority: number;
}

class Router {
  private routes: Route<string>[];
  private layouts: Layout<string>[]
  currentRoute: string;

  constructor() {
    this.routes = [];
    this.layouts = [];
    this.currentRoute = '';
  }

  public addRoute<Path extends string>(path: Path, handler: RouteHandler<RouteParams<Path>>, type: RouteType = "page",  metadata?: MetadataHandler<RouteParams<Path>>): void {
    const hasParams = path.includes(':');
    const getType = type.includes(':') ? 'api' : 'page'


    this.routes.push({
      path: getType === "api" ? `/api${path}` : path, 
      handler,
      hasParams,
      priority: this.calculatePriority(path),
      type,
      metadata: metadata,
      method: getType === "api" ? type.split(":")[1] : "GET"
    });

    // make sure the list is sorted in descending order of priority
    this.routes.sort((a, b) => b.priority - a.priority);
  }
  
  public async generateMetadata(_params: string[]): Promise<Metadata> {
    const pathString = _params ? "/" + _params.join("/") : "/"
    const { route, params } = this.findMatchingRoute(pathString);


    if (route && route.metadata) {
      return await route.metadata(params)
    } else {
      return {}; 
    }
  }

  public async createLayout<Path extends string>(path: Path, handler: LayoutHandler): Promise<void> {
    this.layouts.push({
      path,
      handler,
      priority: this.calculatePriority(path)
    });

    // make sure the list is sorted in descending order of priority
    this.layouts.sort((a, b) => b.priority - a.priority);
  }

  public async init(pathArray: string[]): Promise<React.ReactElement | Response | null> {
    const pathString = pathArray ? "/" + pathArray.join("/") : "/"
    const { route, params } = this.findMatchingRoute(pathString);

    if (pathString === '/favicon.ico') {
      return null;
    }

    if (route) {
      this.currentRoute = route.path !== '/favicon.ico' ? route.path : this.currentRoute
      return await route.handler(params, null);
    } else {
      throw new Error(`No route found for ${pathString}`)
    }
  }

  public initApiRoute() {

    const handleRoute = async (request: NextRequest, context: {params: {router?: string[]}}): Promise<Response | void> => {
      const pathString = `/api/${context.params['router']?.join("/") ?? "/"}`;
      const { route, params } = this.findMatchingRoute(pathString);

      if (route && route.method === request.method) {
        this.currentRoute = route.path;
        // Ensure route.handler returns Response or void
        const result = await route.handler(params, request);
        if (result instanceof Response || typeof result === "undefined") {
          return result;
        } else {
          // Handle unexpected return types, possibly log an error or return a default Response
          console.error("Invalid return type from route handler");
          return new Response("Internal Server Error", { status: 500 });
        }
      } else {
        throw new Error(`No route found for ${pathString}`);
      }
    };

    return {
      GET: handleRoute,
      POST: handleRoute,
      HEAD: handleRoute,
      PUT: handleRoute,
      DELETE: handleRoute,
      PATCH: handleRoute,
    };

  }

  public async initLayout({ children, pathArray }: { children: React.ReactNode, pathArray: string[] }) {
    const pathString = pathArray ? "/" + pathArray.join("/") : "/"

    if (pathString === '/favicon.ico') {
      return null;
    }

    const layout = this.findMatchingLayout(pathString);
    if (!layout) {
      const Layout = async ({ children }: { children: React.ReactNode }) => {
        return (
          <>
            {children}
          </>
        )
      }
      return await Layout({ children });
      
    }



    return await layout.handler({ children, route: pathString });


    
  }

  private calculatePriority(path: string): number {
    const segmentCount = path.split('/').filter(Boolean).length;
    const hasWildcard = path.endsWith('*');
    const hasParam = path.includes(':');
    if (hasWildcard) {
      return 200 + segmentCount; // More segments mean more specific wildcard paths
    } else if (hasParam) {
      return 300 + segmentCount; // Parameterized paths have higher priority
    } else {
      return 400 + segmentCount; // Static paths have the highest priority
    }
  }



  private findMatchingLayout(path: string, layouts = this.layouts): Layout<string> | null {
    let bestMatch: Layout<string> | null = null;
    for (const layout of layouts) {
      if (this.isPathMatch(path, layout.path)) {
        if (!bestMatch || layout.priority > bestMatch.priority) {
          bestMatch = layout;
        }
      }
    }
    return bestMatch;
  }


  private findMatchingRoute(path: string, routes = this.routes): { route: Route<string> | null; params: RouteParams<string> } {
    let bestMatch: Route<string> | null = null;
    let bestParams: RouteParams<string> = {};

    for (const route of routes) {
      const { path: routePath } = route;

      if (this.isPathMatch(path, routePath)) {
        const params = this.extractParams(path, routePath);

        if (!bestMatch ||
          routePath.split("/").length > bestMatch.path.split("/").length ||
          (!route.hasParams && bestMatch.hasParams) ||
          (this.isExactMatch(path, routePath) && !this.isExactMatch(path, bestMatch.path))) {
          bestMatch = route;
          bestParams = params;
        }
      }
    }

    return { route: bestMatch, params: bestParams };
  }

  private isExactMatch(path: string, routePath: string) {
    return path === routePath.replace(/\/:.*?($|\/)/g, "/");  // Replace parameters in the routePath with empty strings
  }

  private isPathMatch(path: string, routePath: string): boolean {
    // Check if the routePath ends with a wildcard
    if (routePath.endsWith('*')) {
      // Remove the wildcard for base comparison, ensuring to capture the base path correctly
      const basePath = routePath.slice(0, -1);
  
      // Match both the basePath exactly and basePath as a prefix
      if (path === basePath.slice(0, -1) || path.startsWith(basePath)) {
        return true;
      }
    } else {
      // Split paths into segments for comparison
      const pathSegments = path.split("/").filter(Boolean);
      const routeSegments = routePath.split("/").filter(Boolean);
  
      // Early return if segment lengths don't match
      if (pathSegments.length !== routeSegments.length) {
        return false;
      }
  
      // Compare each segment
      for (let i = 0; i < pathSegments.length; i++) {
        const pathSegment = pathSegments[i];
        const routeSegment = routeSegments[i];
  
        // Continue matching if the route segment is a parameter or matches exactly
        if (!routeSegment?.startsWith(":") && pathSegment !== routeSegment) {
          return false;
        }
      }
  
      // If all segments match or are parameters, return true
      return true;
    }
  
    // Default to false if no other conditions are met
    return false;
  }

  private extractParams(path: string, routePath: string): RouteParams<any> {
    const pathSegments = path.split("/").filter((segment) => segment !== "");
    const routeSegments = routePath.split("/").filter((segment) => segment !== "");

    return this.extractParamsRecursive(pathSegments, routeSegments);
  }

  private extractParamsRecursive(
    pathSegments: string[],
    routeSegments: string[],
    params: RouteParams<any> = {}
  ): RouteParams<any> {
    if (routeSegments.length === 0) {
      return params;
    }

    const [pathSegment, ...restPathSegments] = pathSegments;
    const [routeSegment, ...restRouteSegments] = routeSegments;

    if (routeSegment && routeSegment?.startsWith(":")) {
      const paramName = routeSegment.slice(1)
      if (pathSegment) {
        params[paramName] = pathSegment;
      }

    } else if (routeSegment !== pathSegment) {
      return {};
    }

    return this.extractParamsRecursive(restPathSegments, restRouteSegments, params);
  }
}

export default Router
