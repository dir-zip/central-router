import React from "react";

type RouteHandler<T extends RouteParams<string>> = (params: T) => Promise<React.ReactElement>;

type RouteParams<Path extends string> = Path extends `${infer Segment}/${infer Rest}`
  ? Segment extends `:${infer Param}`
    ? { [K in Param]: string } & RouteParams<Rest>
    : RouteParams<Rest>
  : Path extends `:${infer Param}`
  ? { [K in Param]: string }
  : Record<string, never>;

interface Route<Path extends string> {
  path: Path;
  handler: RouteHandler<RouteParams<Path>>;
  hasParams: boolean;
  priority: number;
}
type LayoutHandler = ({children}: {children: React.ReactNode}) => Promise<React.ReactElement>

interface Layout<Path extends string> {
  path: Path;
  handler: LayoutHandler
  priority: number;
}

class Router {
  private routes: Route<any>[];
  private layouts: Layout<any>[]
  currentRoute: string;

  constructor() {
    this.routes = [];
    this.layouts = [];
    this.currentRoute = '';
  }

  public addRoute<Path extends string>(path: Path, handler: RouteHandler<RouteParams<Path>>) {
    const hasParams = path.includes(':');
    this.routes.push({
      path,
      handler,
      hasParams,
      priority: this.calculatePriority(path)
    });
  
    // make sure the list is sorted in descending order of priority
    this.routes.sort((a, b) => b.priority - a.priority);
  }

  public async createLayout<Path extends string>(path: Path, handler: LayoutHandler) {
    this.layouts.push({
      path,
      handler,
      priority: this.calculatePriority(path)
    });
    
    // make sure the list is sorted in descending order of priority
    this.layouts.sort((a, b) => b.priority - a.priority);
  }

  public async init(pathArray: string[]): Promise<React.ReactElement | null> {
    const pathString = pathArray ? "/" + pathArray.join("/") : "/"
    const { route, params } = this.findMatchingRoute(pathString);
    if (pathString === '/favicon.ico') {
      return null;
    }
    if (route) {
      this.currentRoute = route.path !== '/favicon.ico' ? route.path : this.currentRoute
      return await route.handler(params);
    } else {
      console.log(`No route found for ${pathString}`);
      return null;
    }
  }

  public async initLayout({children}: {children: React.ReactNode}) {
    if(this.currentRoute) {
      const layout = this.findMatchingLayout(this.currentRoute);

      if(layout) {
        return await layout.handler({children});
      }
  
      const Layout = async ({children}: {children: React.ReactNode}) => {
        return (
          <>
            {children}
          </>
        )
      }
  
      return await Layout({children});
    }
  }

  private calculatePriority(path: string): number {
    // check if there's a parameter after the first '/'
    const hasParamAfterFirstSlash = /\/[^/]+\/:/.test(path);
    if (hasParamAfterFirstSlash) {
      return 1;
    } else if (path.includes('*')) {
      return 0;
    } else {
      return 2;
    }
  }
  

  
  private findMatchingLayout(path: string, layouts = this.layouts): Layout<any> | null {
    const { route } = this.findMatchingRoute(path);
    if (route) {
      for (const layout of layouts) {
        if (route.path.startsWith(layout.path.replace("/*", ""))) {
          return layout;
        }
      }
    }

    return null;
  }


  private findMatchingRoute(path: string, routes = this.routes): { route: Route<any> | null; params: RouteParams<any> } {
    let bestMatch: Route<any> | null = null;
    let bestParams: RouteParams<any> = {};

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

  private isPathMatch(path: string, routePath: string) {
    const pathSegments = path.split("/").filter((segment) => segment !== "");
    const routeSegments = routePath.split("/").filter((segment) => segment !== "");

    if (pathSegments.length !== routeSegments.length) {
      return false;
    }

    for (let i = 0; i < pathSegments.length; i++) {
      const pathSegment = pathSegments[i];
      const routeSegment = routeSegments[i];

      if (routeSegment?.startsWith(":")) {
        continue;
      }

      if (pathSegment !== routeSegment) {
        return false;
      }
    }

    return true;
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
      if(pathSegment) {
        params[paramName] = pathSegment;
      }

    } else if (routeSegment !== pathSegment) {
      return {};
    }

    return this.extractParamsRecursive(restPathSegments, restRouteSegments, params);
  }
}

export default Router