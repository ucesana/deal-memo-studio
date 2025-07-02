import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export function blobToBase64(blob: Blob): Observable<string> {
  return from(blob.arrayBuffer()).pipe(
    map((arrayBuffer) => {
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }),
  );
}
