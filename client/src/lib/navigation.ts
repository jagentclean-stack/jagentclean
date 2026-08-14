export function getNewWindowLinkProps(openNewWindow: boolean | null | undefined) {
  return openNewWindow ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
