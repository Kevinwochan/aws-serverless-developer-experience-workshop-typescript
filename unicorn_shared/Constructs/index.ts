import { aws_events as events } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Stage, UNICORN_NAMESPACES } from '../index';
import {
    CfnRegistry,
    CfnRegistryPolicy,
    CfnSchema,
} from "aws-cdk-lib/aws-eventschemas";
import {
    AccountPrincipal,
    PolicyDocument,
    PolicyStatement,
} from "aws-cdk-lib/aws-iam";

interface EventSchemaStackProps {
    name: string,
    namespace: string;
    schemas: CfnSchema[];
}

/* 
  Defines the event bus policies that determine who can create rules on the event bus to
  subscribe to events published by Unicorn Contracts Service.
 */

export class EventsSchemaConstruct extends Construct {
    public readonly registry: CfnRegistry;
    constructor(scope: Construct, id: string, props: EventSchemaStackProps) {
        super(scope, id);

        this.registry = new CfnRegistry(this, `${props.namespace}`, {
            description: `Event schemas for ${props.namespace}`,
            registryName: props.name,
        });

        const schemaArns = props.schemas.map((s) => s.attrSchemaArn);

        new CfnRegistryPolicy(this, "RegistryPolicy", {
            registryName: props.name,
            policy: new PolicyDocument({
                statements: [
                    new PolicyStatement({
                        sid: "AllowExternalServices",
                        principals: [new AccountPrincipal(Stack.of(this).account)],
                        actions: [
                            "schemas:DescribeCodeBinding",
                            "schemas:DescribeRegistry",
                            "schemas:DescribeSchema",
                            "schemas:GetCodeBindingSource",
                            "schemas:ListSchemas",
                            "schemas:ListSchemaVersions",
                            "schemas:SearchSchemas",
                        ],
                        resources: [...schemaArns, this.registry.attrRegistryArn]
                        //- Fn::GetAtt: EventRegistry.RegistryArn
                        //- Fn::Sub: "arn:${AWS::Partition}:schemas:${AWS::Region}:${AWS::AccountId}:schema/${EventRegistry.RegistryName}*"
                    }),
                ],
            }).toString(),
        });
    }
}

interface SubscriberPoliciesStackProps {
    stage: Stage;
    eventBus: events.EventBus;
    sources: UNICORN_NAMESPACES[];
}
/*
  Defines the event bus policies that determine who can create rules on the event bus to
  subscribe to events published by the Contracts Service.
*/
export class SubscriberPoliciesConstruct extends Construct {
    constructor(
        scope: Construct,
        id: string,
        props: SubscriberPoliciesStackProps
    ) {
        super(scope, id);

        const policyStatement = new iam.PolicyStatement({
            principals: [new iam.AccountRootPrincipal()],
            actions: [
                "events:PutRule",
                "events:DeleteRule",
                "events:DescribeRule",
                "events:DisableRule",
                "events:EnableRule",
                "events:PutTargets",
                "events:RemoveTargets",
            ],
            resources: [props.eventBus.eventBusArn],
            conditions: {
                StringEqualsIfExists: {
                    "events:creatorAccount": Stack.of(this).account,
                },
                StringEquals: {
                    "events:source": props.sources
                },
                Null: {
                    "event:source": false
                }
            },
        }).toJSON();
        const eventBusPolicy = new events.EventBusPolicy(this, "MyEventBusPolicy", {
            statementId: `OnlyRulesForContractServiceEvents-${props.stage}`,
            eventBus: props.eventBus,
            statement: policyStatement,
        });
    }
}
