#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { UnicornConstractsStack } from '../lib/cdk-stack';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/** The different stages for the app. */
export enum Stage {
    local = "local",
    dev = "dev",
    prod = "prod",
}

/** Account id for different stages. */
export const AccountId = {
    // BETA AWS account id
    "dev": "819998446679",
    // PROD AWS account id
    "prod": "819998446679",
}

export const LogsRetentionPeriod = (stage: Stage) => {
    switch (stage) {
        case Stage.local:
            return RetentionDays.ONE_DAY;
        case Stage.dev:
            return RetentionDays.ONE_WEEK;
        case Stage.prod:
            return RetentionDays.TWO_WEEKS
        default:
            return RetentionDays.ONE_DAY;

    }
}

export const isProd = (stage: Stage) => stage === Stage.prod;

const app = new cdk.App();

new UnicornConstractsStack(app, `uni-prop-${Stage.local}-contracts`, {
    stage: Stage.local,
    tags: {
        stage: Stage.local,
        project: "AWS_Serverless_Developer_Experience",
    }, env: { account: "819998446679", region: "ap-southeast-2" }
});

//new EventsSchemaStack()
// new SubscriberPoliciesStack()
