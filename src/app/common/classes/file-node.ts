export interface FileNode {
  id: string;
  name: string;
  type: string;
  icon: string;
  iconColor: string;
  warning: string | null;
  mimeType: string;
  children?: FileNode[];
  file: gapi.client.drive.File;
}

export function toFileNodes(files: gapi.client.drive.File[]): FileNode[] {
  return files.map((file) => toFileNode(file));
}

function getIcon(file: gapi.client.drive.File): string {
  switch (file.mimeType) {
    case 'application/vnd.google-apps.folder':
      return 'folder';
    case 'application/vnd.google-apps.spreadsheet':
      return 'table_chart';
    case 'application/pdf':
      return 'picture_as_pdf';
    default:
      return 'article';
  }
}

function getIconColor(file: gapi.client.drive.File) {
  switch (file.mimeType) {
    case 'application/vnd.google-apps.spreadsheet':
      return '#1E8E3E';
    case 'application/vnd.google-apps.document':
      return '#1A73E8';
    case 'application/pdf':
      return '#F44336';
    default:
      return 'grey';
  }
}

function getWarning(file: gapi.client.drive.File) {
  return !file.mimeType?.includes('application/vnd.google-apps')
    ? 'Not a Google Document.'
    : null;
}

function getChildren(file: gapi.client.drive.File) {
  return file.mimeType === 'application/vnd.google-apps.folder'
    ? []
    : undefined;
}

function getType(file: gapi.client.drive.File) {
  return file.mimeType === 'application/vnd.google-apps.folder'
    ? 'folder'
    : 'file';
}

export function toFileNode(file: gapi.client.drive.File): FileNode {
  return {
    id: file.id ?? '',
    name: file.name ?? '',
    type: getType(file),
    icon: getIcon(file),
    iconColor: getIconColor(file),
    mimeType: file.mimeType ?? '',
    warning: getWarning(file),
    children: getChildren(file),
    file,
  };
}
