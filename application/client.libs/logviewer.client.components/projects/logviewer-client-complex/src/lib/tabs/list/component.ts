import { Component, OnDestroy, Input, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ITab, TabsService } from '../service';
import { TabsOptions, ETabsListDirection } from '../options';
import { Subscription } from 'rxjs';

@Component({
    selector: 'lib-complex-tabs-list',
    templateUrl: './template.html',
    styleUrls: ['./styles.less']
})

export class TabsListComponent implements OnDestroy, AfterViewInit {

    @Input() public service: TabsService = null;

    public _options: TabsOptions = new TabsOptions();

    private _subscriptions: { [key: string]: Subscription } = { };
    private _destroyed: boolean = false;
    private _tabs: Map<string, ITab> = new Map();

    public tabs: ITab[] = [];

    constructor(private _cdRef: ChangeDetectorRef) {
    }

    ngAfterViewInit() {
        if (!this.service) {
            return;
        }
        this._subscriptions.new = this.service.getObservable().new.subscribe(this.onNewTab.bind(this));
        this._subscriptions.removed = this.service.getObservable().removed.subscribe(this.onRemoveTab.bind(this));
        this._subscriptions.active = this.service.getObservable().active.subscribe(this.onActiveTabChange.bind(this));
        this._subscriptions.options = this.service.getObservable().options.subscribe(this._onOptionsUpdated.bind(this));
        this._subscriptions.updated = this.service.getObservable().updated.subscribe(this._onTabUpdated.bind(this));
        this._tabs = this.service.getTabs();
        this._tabs.forEach((tab: ITab) => {
            this.tabs.push(tab);
        });
        this._getDefaultOptions();
    }

    ngOnDestroy() {
        this._destroyed = true;
        Object.keys(this._subscriptions).forEach((key: string) => {
            if (this._subscriptions[key] !== null) {
                this._subscriptions[key].unsubscribe();
            }
        });
    }

    public _ng_onClick(tabkey: string) {
        this.service.setActive(tabkey);
        this._forceUpdate();
    }

    public _ng_onTabClose(event: MouseEvent, tabkey: string) {
        this.service.remove(tabkey);
        event.stopImmediatePropagation();
        event.preventDefault();
        this._forceUpdate();
        return false;
    }

    private async onNewTab(tab: ITab) {
        this._tabs.set(tab.guid, await tab);
        this.tabs.push(tab);
        this._forceUpdate();
    }

    private async onRemoveTab(guid: string) {
        this._tabs.delete(guid);
        this.tabs = this.tabs.filter((tab: ITab) => {
            return tab.guid !== guid;
        });
        this._forceUpdate();
    }

    private async onActiveTabChange(tab: ITab) {
        this._tabs.forEach((storedTab: ITab, guid: string) => {
            if (storedTab.guid !== tab.guid && storedTab.active) {
                storedTab.active = false;
                this._tabs.set(guid, storedTab);
            }
            if (storedTab.guid === tab.guid && !storedTab.active) {
                storedTab.active = true;
                this._tabs.set(guid, storedTab);
            }
        });
        this._forceUpdate();
    }

    private async _getDefaultOptions() {
        this._options = await this.service.getOptions();
        this._forceUpdate();
    }

    private async _onOptionsUpdated(options: TabsOptions) {
        this._options = await options;
        this._forceUpdate();
    }

    private async _onTabUpdated(tab: ITab) {
        this._tabs.set(tab.guid, tab);
        this.tabs = this.tabs.map((storedTab: ITab) => {
            if (storedTab.guid === tab.guid) {
                return tab;
            }
            return storedTab;
        });
        this._forceUpdate();
    }

    private _forceUpdate() {
        if (this._destroyed) {
            return;
        }
        this._cdRef.detectChanges();
    }

}