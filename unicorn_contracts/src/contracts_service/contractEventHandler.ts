// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { Context, SQSEvent, SQSRecord } from "aws-lambda";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ContractDBType, ContractStatusEnum, ContractError } from "./Contract";
import {
  DynamoDBClient, UpdateItemCommand, UpdateItemCommandInput, UpdateItemCommandOutput, PutItemCommandInput, PutItemCommandOutput, PutItemCommand
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

// TODO: Initialize configuration for DynamoDB
const ddbClient = new DynamoDBClient({});
const DDB_TABLE = process.env.DYNAMODB_TABLE;


class ContractEventHandlerFunction {

  /**
   * Handles the SQS event and processes each record.
   * 
   * @public
   * @async
   * @method handler
   * @param {SQSEvent} event - The SQS event containing the records to process.
   * @param {Context} context - The AWS Lambda context.
   * @returns {Promise<void>} - A promise that resolves when all records have been processed.
   */
  public async handler(
    event: SQSEvent,
    context: Context
  ): Promise<void> {

    // Parse SQS records
    for (const sqsRecord of event.Records) {
      const contract = this.parseRecord(sqsRecord);
      switch (sqsRecord.messageAttributes.HttpMethod.stringValue) {
        case "POST":
          console.log("Creating a contract", { contract });
          try {
            // Save the entry.
            // TODO action to add DynamoDB implementation
          } catch (error) {
            console.log("Error during DDB PUT", error as Error);
            throw error;
          }
          break;
        case "PUT":
          console.log("Updating a contract", { contract });
          try {
            // Update the entry.
            await this.updateContract(contract);
          } catch (error) {
            console.log("Error during DDB UPDATE", error as Error);
            throw error;
          }
          break;
        default:
          console.log("Error request not supported");
      }
    }
  }

  /**
   * Creates a new contract in the database.
   * 
   * @private
   * @async
   * @method createContract
   * @param {ContractDBType} contract - The contract to be created.
   * @returns {Promise<void>} - A promise that resolves when the contract is created.
   * @throws {ContractError} - If there is an error during the creation process.
   */
  private async createContract(contract: ContractDBType): Promise<void> {
    throw Error("Not implemented");
  }

  /**
   * Updates a contract in the database.
   * 
   * @private
   * @async
   * @method updateContract
   * @param {ContractDBType} contract - The contract to be updated.
   * @returns {Promise<void>} - A promise that resolves when the update is complete.
   */
  private async updateContract(contract: ContractDBType): Promise<void> {
    const modifiedDate = new Date();
    const dbEntry: ContractDBType = {
      contract_id: contract.contract_id,
      property_id: contract.property_id,
      contract_status: ContractStatusEnum.APPROVED,
      contract_last_modified_on: modifiedDate.toISOString(),
    };

    console.log("Record to update", { dbEntry })
    const ddbUpdateCommandInput: UpdateItemCommandInput = {
      TableName: DDB_TABLE,
      Key: { property_id: { S: dbEntry.property_id } },
      UpdateExpression: "set contract_status = :t, modified_date = :m",
      ConditionExpression: 'attribute_exists(property_id) AND contract_status = :DRAFT',
      ExpressionAttributeValues: {
        ":t": { S: dbEntry.contract_status as string },
        ":m": { S: dbEntry.contract_last_modified_on as string },
        ':DRAFT': { S: ContractStatusEnum.DRAFT },
      },
    };


    const ddbUpdateCommand = new UpdateItemCommand(ddbUpdateCommandInput);

    // Send the command
    const ddbUpdateCommandOutput: UpdateItemCommandOutput = await ddbClient.send(
      ddbUpdateCommand
    );
    if (ddbUpdateCommandOutput.$metadata.httpStatusCode != 200) {
      const error: ContractError = {
        propertyId: dbEntry.property_id,
        name: "ContractDBUpdateError",
        message:
          "Response error code: " +
          ddbUpdateCommandOutput.$metadata.httpStatusCode,
        object: ddbUpdateCommandOutput.$metadata,
      };
      throw error;
    }

    console.log("Updated record for contract", {
      contractId: dbEntry.contract_id,
      metdata: ddbUpdateCommandOutput.$metadata,
    });
  }

  /**
   * Parses an SQS record into ContractDBType
   * 
   * @private
   * @method validateRecord
   * @param {SQSRecord} record - The SQS record containing the contract.
   * @returns {ContractDBType} - The contract from the SQS record
   */
  private parseRecord(record: SQSRecord): ContractDBType {
    let contract: ContractDBType;
    try {
      contract = JSON.parse(record.body);
    } catch (error) {
      console.log("Error parsing SQS Record", error as Error);
      throw (new Error("Error parsing SQS Record"));
    }
    console.log("Returning contract", { contract });
    return contract;
  }
}

export const myFunction = new ContractEventHandlerFunction();
export const lambdaHandler = myFunction.handler.bind(myFunction);
