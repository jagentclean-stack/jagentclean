export type MenuTreeItem<T extends { id: number; parentId: number | null; order: number | null }> = T & {
  children: MenuTreeItem<T>[];
};

/** 將已篩選、已排序的 CMS 選單資料轉為公開前台使用的階層結構。 */
export function buildMenuTree<T extends { id: number; parentId: number | null; order: number | null }>(items: T[]): MenuTreeItem<T>[] {
  const nodes = new Map<number, MenuTreeItem<T>>(
    items.map((item) => [item.id, { ...item, children: [] }])
  );
  const roots: MenuTreeItem<T>[] = [];

  for (const item of items) {
    const node = nodes.get(item.id)!;
    if (item.parentId !== null && nodes.has(item.parentId)) {
      nodes.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const byOrder = (a: MenuTreeItem<T>, b: MenuTreeItem<T>) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id;
  const sortBranch = (branch: MenuTreeItem<T>[]) => {
    branch.sort(byOrder);
    branch.forEach((item) => sortBranch(item.children));
  };
  sortBranch(roots);
  return roots;
}
