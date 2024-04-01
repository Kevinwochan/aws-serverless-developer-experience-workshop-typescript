/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/
import { parse } from 'path';
import { CfnResource, Stack, aws_lambda } from 'aws-cdk-lib';
import { CfnFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NagRuleCompliance, NagRules } from 'cdk-nag';

/**
 * Ensure Lambda functions have tracing enabled
 * @param node the CfnResource to check
 */
export default Object.defineProperty(
    (node: CfnResource): NagRuleCompliance => {
        if (node instanceof CfnFunction) {
            const tracingConfig = Stack.of(node).resolve(node.tracingConfig);
            if (tracingConfig === aws_lambda.Tracing.ACTIVE) return NagRuleCompliance.COMPLIANT;
            return NagRuleCompliance.NON_COMPLIANT;
        }
        return NagRuleCompliance.NOT_APPLICABLE;
    },
    'name', { value: parse(__filename).name }
);