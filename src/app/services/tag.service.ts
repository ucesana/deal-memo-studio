import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export type TagData = string[][];
export type DocumentTagData = TagData[];

export const getArtistName: (tagData: TagData, idx: number) => string = (
  tagData: TagData,
  idx: number,
) => getTagValue(tagData, 'Artist Name', `Deal Memo ${idx + 1}`);

export const getTagValue: (
  tagData: TagData,
  tagName: string,
  defaultValue?: string,
) => string = (
  tagData: TagData,
  tagName: string,
  defaultValue: string = 'unknown',
) => tagData.find((tag: string[]) => tag[0] === tagName)?.[1] ?? defaultValue;

@Injectable({
  providedIn: 'root',
})
export class TagService {
  // @ts-ignore
  private _documentTagsSubject: Subject<DocumentTagData> = new BehaviorSubject(
    [],
  );

  constructor() {}

  public setDocumentTags(tags: DocumentTagData): void {
    this._documentTagsSubject.next(tags);
  }

  public getDocumentTags(): Observable<DocumentTagData> {
    return this._documentTagsSubject.asObservable();
  }
}
