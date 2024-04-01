import * as UnicornSharedConstruct from './constructs';
export { UnicornSharedConstruct };

import { ServerlessChecks } from './CdkNagPack/serverless-pack';
export { ServerlessChecks };

import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export enum UNICORN_NAMESPACES {
    CONTRACTS = 'unicorn.contracts',
    PROPERTIES = 'unicorn.properties',
    WEB = 'unicorn.web',
}

/** The different stages for the app. */
export enum Stage {
    local = 'local',
    dev = 'dev',
    prod = 'prod',
}

export const isProd = (stage: Stage) => stage === Stage.prod;

export const logsRetentionPeriod = (stage: Stage) => {
    switch (stage) {
        case Stage.local:
            return RetentionDays.ONE_DAY;
        case Stage.dev:
            return RetentionDays.ONE_WEEK;
        case Stage.prod:
            return RetentionDays.TWO_WEEKS;
        default:
            return RetentionDays.ONE_DAY;
    }
};

export const eventBusName = (stage: Stage, namespace: UNICORN_NAMESPACES) => {
    switch (namespace) {
        case UNICORN_NAMESPACES.CONTRACTS:
            return `UnicornContractsBus-${stage}`; // use the
        case UNICORN_NAMESPACES.PROPERTIES:
            return `UnicornPropertiesBus-${stage}`;
        case UNICORN_NAMESPACES.WEB:
            return `UnicornWebBus-${stage}`;
        default:
            throw new Error(
                `Error generatinig Event Bus Name Unknown namespace: ${namespace}`
            );
    }
};
