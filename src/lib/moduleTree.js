// The API returns a flat list. Each item's own identity is `Code`; its parent
// is whichever other item has that same value in `AreaCode`. Root modules use
// AreaCode: 0. The API's own `Children` arrays are inconsistent (a parent can
// list no children even though other items point back to it), so the tree is
// always rebuilt here from Code/AreaCode rather than trusted as-is.
export function buildModuleTree(items) {
  const byCode = new Map();
  items.forEach((item) => {
    byCode.set(item.Code, { ...item, Children: [] });
  });

  const roots = [];
  byCode.forEach((node) => {
    const parent = node.AreaCode && node.AreaCode !== node.Code ? byCode.get(node.AreaCode) : null;
    if (parent) {
      parent.Children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByCode = (nodes) => {
    nodes.sort((a, b) => a.Code - b.Code);
    nodes.forEach((n) => sortByCode(n.Children));
  };
  sortByCode(roots);

  return roots;
}

export function nodeMatches(node, query) {
  return node.Description?.toLowerCase().includes(query) || String(node.Code).includes(query);
}

// Keep only branches that match the query themselves or contain a match.
export function filterTree(nodes, query) {
  if (!query) return nodes;

  return nodes.reduce((acc, node) => {
    const filteredChildren = filterTree(node.Children, query);
    if (nodeMatches(node, query) || filteredChildren.length > 0) {
      acc.push({ ...node, Children: filteredChildren });
    }
    return acc;
  }, []);
}

// Where a leaf module actually routes to: a curated mapping if one exists,
// otherwise the generic placeholder route keyed by Code.
export function resolveModulePath(node, routeMap) {
  return routeMap[node.Code] ?? `/modules/${node.Code}`;
}

// True if `node` itself, or any of its descendants, resolves to the given
// pathname — used both to find the active top-level root and to
// auto-expand the branch containing the current route.
export function nodeContainsPath(node, pathname, routeMap) {
  const nodePath = resolveModulePath(node, routeMap);
  if (pathname === nodePath || pathname.startsWith(`${nodePath}/`)) return true;
  return node.Children.some((child) => nodeContainsPath(child, pathname, routeMap));
}

// Find the root node whose own path, or one of its descendants' paths, is a
// prefix of the current location — used to highlight the active top-level
// item in the sidebar. Falls back to the first root if nothing matches.
export function findActiveRoot(tree, pathname, routeMap) {
  return tree.find((node) => nodeContainsPath(node, pathname, routeMap)) ?? tree[0] ?? null;
}

// First navigable leaf in the tree, walking the same Code-ascending,
// depth-first order buildModuleTree already sorts into. A node is a leaf
// when it has no children — the same convention SidebarNode.jsx uses to
// decide link vs. expandable folder. Returns null if the tree has no
// leaves (e.g. an empty tree).
export function findFirstLeaf(tree, routeMap) {
  for (const node of tree) {
    if (node.Children.length === 0) {
      return resolveModulePath(node, routeMap);
    }
    const path = findFirstLeaf(node.Children, routeMap);
    if (path) return path;
  }
  return null;
}

// True when `pathname` is a route governed by the module/role permission
// system — either the generic `/modules/:code` placeholder or one of the
// hand-curated moduleRouteMap destinations (or a sub-path of one, e.g.
// "/Administration/Users/create" under the "/Administration/Users" grant).
// Legacy pages with no module code at all are deliberately left out of
// this check since there's no permission data to enforce against them.
export function isModuleControlledPath(pathname, routeMap) {
  if (/^\/modules\/[^/]+/.test(pathname)) return true;

  return Object.values(routeMap).some(
    (mappedPath) => pathname === mappedPath || pathname.startsWith(`${mappedPath}/`)
  );
}

// True if some node in the tree resolves to, or is an ancestor of, the
// given pathname — i.e. the current route is one the user's role(s) grant.
export function isPathGranted(tree, pathname, routeMap) {
  return tree.some((node) => nodeContainsPath(node, pathname, routeMap));
}
