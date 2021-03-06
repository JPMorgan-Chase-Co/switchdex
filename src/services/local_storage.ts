import { BigNumber } from '@0x/utils';

import { CHAIN_ID, FILLS_LIMIT, NETWORK_ID, NOTIFICATIONS_LIMIT } from '../common/constants';
import { Fill, MarketFill, Notification, UserConfigData, Wallet } from '../util/types';

const addPrefix = (key: string) => `VeriDex.${key}`;

const notificationsKey = addPrefix('notifications');
const fillsKey = addPrefix('fills');
const hasUnreadNotificationsKey = addPrefix('hasUnreadNotifications');
const lastBlockCheckedKey = addPrefix('lastBlockChecked');
const adBlockMessageShownKey = addPrefix('adBlockMessageShown');
const walletConnectedKey = addPrefix('walletConnected');
const themeNameKey = addPrefix('themeName');
const erc20LayoutKey = addPrefix('erc20Layout');
const dynamicLayoutKey = addPrefix('dynamicLayoutKey');
const userConfigDataKey = addPrefix('userConfigData');

export class LocalStorage {
    private readonly _storage: Storage;

    constructor(storage: Storage = localStorage) {
        this._storage = storage;
    }

    public saveNotifications(notifications: Notification[], account: string): void {
        const currentNotifications = JSON.parse(this._storage.getItem(notificationsKey) || '{}');
        const newNotifications = {
            ...currentNotifications,
            [NETWORK_ID]: {
                ...currentNotifications[NETWORK_ID],
                [account]: notifications,
            },
        };
        // Sort array by timestamp property
        newNotifications[NETWORK_ID][account] = newNotifications[NETWORK_ID][account].sort(
            (a: Notification, b: Notification) => {
                const aTimestamp = a.timestamp ? a.timestamp.getTime() : 0;
                const bTimestamp = b.timestamp ? b.timestamp.getTime() : 0;
                return bTimestamp - aTimestamp;
            },
        );
        // Limit number of notifications
        if (newNotifications[NETWORK_ID][account].length > NOTIFICATIONS_LIMIT) {
            newNotifications[NETWORK_ID][account].length = NOTIFICATIONS_LIMIT;
        }

        this._storage.setItem(notificationsKey, JSON.stringify(newNotifications));
    }

    public getNotifications(account: string): Notification[] {
        const currentNotifications = JSON.parse(
            this._storage.getItem(notificationsKey) || '{}',
            (key: string, value: string) => {
                if (key === 'amount') {
                    return new BigNumber(value);
                }
                if (key === 'timestamp') {
                    return new Date(value);
                }
                if (key === 'tx') {
                    return Promise.resolve();
                }
                return value;
            },
        );
        if (currentNotifications[NETWORK_ID] && currentNotifications[NETWORK_ID][account]) {
            return currentNotifications[NETWORK_ID][account];
        }
        return [];
    }

    public saveHasUnreadNotifications(hasUnreadNotifications: boolean, account: string): void {
        const currentStatuses = JSON.parse(this._storage.getItem(hasUnreadNotificationsKey) || '{}');
        const newStatuses = {
            ...currentStatuses,
            [NETWORK_ID]: {
                ...currentStatuses[NETWORK_ID],
                [account]: hasUnreadNotifications,
            },
        };

        this._storage.setItem(hasUnreadNotificationsKey, JSON.stringify(newStatuses));
    }

    public getHasUnreadNotifications(account: string): boolean {
        const currentNotifications = JSON.parse(this._storage.getItem(hasUnreadNotificationsKey) || '{}');
        if (currentNotifications[NETWORK_ID] && currentNotifications[NETWORK_ID][account]) {
            return currentNotifications[NETWORK_ID][account];
        }
        return false;
    }
    public getFills(account: string): Fill[] {
        const currentFills = JSON.parse(this._storage.getItem(fillsKey) || '{}', (key: string, value: string) => {
            if (key === 'amountQuote' || key === 'amountBase') {
                return new BigNumber(value);
            }
            if (key === 'timestamp') {
                return new Date(value);
            }
            if (key === 'tx') {
                return Promise.resolve();
            }
            return value;
        });

        if (currentFills[NETWORK_ID] && currentFills[NETWORK_ID][account]) {
            return currentFills[NETWORK_ID][account];
        }
        return [];
    }
    public getMarketFills(account: string): MarketFill {
        const currentFills = JSON.parse(this._storage.getItem(fillsKey) || '{}', (key: string, value: string) => {
            if (key === 'amountQuote' || key === 'amountBase') {
                return new BigNumber(value);
            }
            if (key === 'timestamp') {
                return new Date(value);
            }
            if (key === 'tx') {
                return Promise.resolve();
            }
            return value;
        });
        if (currentFills[NETWORK_ID] && currentFills[NETWORK_ID].markets && currentFills[NETWORK_ID].markets[account]) {
            return currentFills[NETWORK_ID].markets[account];
        }
        return {};
    }

    public saveFills(fills: Fill[], account: string): void {
        const currentFills = JSON.parse(this._storage.getItem(fillsKey) || '{}');
        const newFills = {
            ...currentFills,
            [NETWORK_ID]: {
                ...currentFills[NETWORK_ID],
                [account]: fills,
            },
        };
        // Sort array by timestamp property
        newFills[NETWORK_ID][account] = newFills[NETWORK_ID][account].sort((a: Fill, b: Fill) => {
            const aTimestamp = a.timestamp ? a.timestamp.getTime() : 0;
            const bTimestamp = b.timestamp ? b.timestamp.getTime() : 0;
            return bTimestamp - aTimestamp;
        });
        // Limit number of fills
        if (newFills[NETWORK_ID][account].length > FILLS_LIMIT) {
            newFills[NETWORK_ID][account].length = FILLS_LIMIT;
        }

        this._storage.setItem(fillsKey, JSON.stringify(newFills));
    }
    // Accumulate market fills
    public saveMarketFills(marketFills: MarketFill, account: string): void {
        const currentFills = JSON.parse(this._storage.getItem(fillsKey) || `{"${CHAIN_ID}": {"markets": {}}}`);
        const newFills = {
            ...currentFills,
            [NETWORK_ID]: {
                ...currentFills[NETWORK_ID],
                markets: {
                    ...currentFills[NETWORK_ID].markets,
                    [account]: marketFills,
                },
            },
        };

        Object.keys(newFills[NETWORK_ID].markets[account]).forEach((m: string) => {
            // Sort array by timestamp property
            newFills[NETWORK_ID].markets[account][m] = newFills[NETWORK_ID].markets[account][m].sort(
                (a: Fill, b: Fill) => {
                    const aTimestamp = a.timestamp ? a.timestamp.getTime() : 0;
                    const bTimestamp = b.timestamp ? b.timestamp.getTime() : 0;
                    return bTimestamp - aTimestamp;
                },
            );
            // Limit number of fills
            if (newFills[NETWORK_ID].markets[account][m].length > FILLS_LIMIT) {
                newFills[NETWORK_ID].markets[account][m].length = FILLS_LIMIT;
            }
        });

        this._storage.setItem(fillsKey, JSON.stringify(newFills));
    }

    public saveLastBlockChecked(lastBlockChecked: number, account: string): void {
        const currentBlocks = JSON.parse(this._storage.getItem(lastBlockCheckedKey) || '{}');
        const newBlocks = {
            ...currentBlocks,
            [NETWORK_ID]: {
                ...currentBlocks[NETWORK_ID],
                [account]: lastBlockChecked,
            },
        };

        this._storage.setItem(lastBlockCheckedKey, JSON.stringify(newBlocks));
    }

    public getLastBlockChecked(account: string): number | null {
        const currentLastBlockChecked = JSON.parse(this._storage.getItem(lastBlockCheckedKey) || '{}');
        if (currentLastBlockChecked[NETWORK_ID] && currentLastBlockChecked[NETWORK_ID][account]) {
            return currentLastBlockChecked[NETWORK_ID][account];
        }
        return null;
    }

    public saveAdBlockMessageShown(adBlockMessageShown: boolean): void {
        this._storage.setItem(adBlockMessageShownKey, JSON.stringify(adBlockMessageShown));
    }

    public getAdBlockMessageShown(): boolean {
        return JSON.parse(this._storage.getItem(adBlockMessageShownKey) || 'false');
    }

    public saveWalletConnected(walletConnected: string): void {
        this._storage.setItem(walletConnectedKey, JSON.stringify(walletConnected));
    }
    public resetWalletConnected(): void {
        this._storage.setItem(walletConnectedKey, JSON.stringify(false));
    }
    public getWalletConnected(): Wallet | null | boolean {
        return JSON.parse(this._storage.getItem(walletConnectedKey) || JSON.stringify(false));
    }
    public getThemeName(): string | null {
        return JSON.parse(this._storage.getItem(themeNameKey) || 'null');
    }

    public getErc20Layout(): string | null {
        return JSON.parse(this._storage.getItem(erc20LayoutKey) || 'null');
    }

    public getUserConfigData(): UserConfigData | null {
        return JSON.parse(this._storage.getItem(userConfigDataKey) || 'null');
    }
    public getDynamicLayout(): boolean {
        return JSON.parse(this._storage.getItem(dynamicLayoutKey) || 'false');
    }
    public saveDynamicLayout(isDynamicLayout: boolean): void {
        this._storage.setItem(dynamicLayoutKey, JSON.stringify(isDynamicLayout));
    }

    public saveErc20Layout(erc20Layout?: string): void {
        if (erc20Layout) {
            this._storage.setItem(erc20LayoutKey, JSON.stringify(erc20Layout));
        }
    }
    public saveThemeName(themeName?: string): void {
        if (themeName) {
            this._storage.setItem(themeNameKey, JSON.stringify(themeName));
        }
    }
    public saveUserConfigData(userConfigData?: UserConfigData | null): void {
        if (userConfigData) {
            this._storage.setItem(userConfigDataKey, JSON.stringify(userConfigData));
        } else {
            this._storage.removeItem(userConfigDataKey);
        }
    }
}
