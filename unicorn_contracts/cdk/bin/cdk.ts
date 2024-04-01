#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { UnicornConstractsStack } from '../lib/unicorn-contracts-stack';
import { ServerlessChecks, Stage, UNICORN_NAMESPACES } from 'unicorn_shared';

const app = new cdk.App();

const generateTags = (stage: Stage) => {
    return {
        stage: stage,
        project: 'AWS_Serverless_Developer_Experience',
        namespace: UNICORN_NAMESPACES.CONTRACTS,
    };
};

Object.values(Stage).map((stage) => {
    new UnicornConstractsStack(app, `uni-prop-${stage}-contracts`, {
        stage: stage,
        tags: generateTags(stage),
    });
});
cdk.Aspects.of(app).add(new ServerlessChecks());

