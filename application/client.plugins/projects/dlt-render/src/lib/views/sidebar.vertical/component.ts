// tslint:disable:no-inferrable-types
// tslint:disable:max-line-length

import { Component, OnDestroy, ChangeDetectorRef, AfterViewInit, Input, AfterContentInit } from '@angular/core';
import * as Toolkit from 'logviewer.client.toolkit';
import { Subscription } from 'rxjs';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { CDelimiters, CColumnsHeaders } from '../../render/row.columns.api';
import { isDLTSource } from '../../render/row.columns';

@Component({
    selector: Toolkit.EViewsTypes.sidebarVertical,
    templateUrl: './template.html',
    styleUrls: ['./styles.less']
})

export class SidebarVerticalComponent implements AfterViewInit, OnDestroy, AfterContentInit {

    @Input() public api: Toolkit.IAPI;
    @Input() public session: string;

    public _ng_columns: Array<{ name: string, html: SafeHtml }> = [];
    public _ng_arguments: SafeHtml[] = [];

    private _subscriptions: { [key: string]: Subscription } = {};
    private _destroyed: boolean = false;

    constructor(private _cdRef: ChangeDetectorRef, private _sanitizer: DomSanitizer) {
    }

    public ngOnDestroy() {
        this._destroyed = true;
        Object.keys(this._subscriptions).forEach((key: string) => {
            this._subscriptions[key].unsubscribe();
        });
    }

    public ngAfterContentInit() {
        if (this.api === undefined) {
            return;
        }
        this._subscriptions.onRowSelected = this.api.getViewportEventsHub().getObservable().onRowSelected.subscribe(this._onRowSelected.bind(this));
    }

    public ngAfterViewInit() {
        this._cdRef.detectChanges();
    }

    private _onRowSelected(event: Toolkit.IOnRowSelectedEvent) {
        if (!isDLTSource(event.source.name)) {
            this._ng_columns = [];
            this._ng_arguments = [];
            return this._forceUpdate();
        }
        const columns: string[] = event.str.split(CDelimiters.columns);
        if (columns.length !== CColumnsHeaders.length) {
            this._ng_columns = [];
            this._ng_arguments = [];
            return this._forceUpdate();
        }
        this._ng_columns = columns.map((value: string, index: number) => {
            return { name: CColumnsHeaders[index], html: this._sanitizer.bypassSecurityTrustHtml(value) };
        });
        const payload: string = columns[columns.length - 1];
        this._ng_arguments = payload.split(CDelimiters.arguments);
        return this._forceUpdate();
    }

    private _forceUpdate() {
        if (this._destroyed) {
            return;
        }
        this._cdRef.detectChanges();
    }

}
