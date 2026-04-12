import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export class DynamoDBLib {
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  constructor(region?: string) {
    this.client = new DynamoDBClient({ region: region ?? "ap-southeast-1" });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  async put(tableName: string, item: Record<string, any>): Promise<void> {
    await this.docClient.send(new PutCommand({
      TableName: tableName,
      Item: item,
    }));
  }

  async get(tableName: string, key: Record<string, any>): Promise<Record<string, any> | null> {
    const result = await this.docClient.send(new GetCommand({
      TableName: tableName,
      Key: key,
    }));
    return result.Item || null;
  }

  async query(tableName: string, params: any): Promise<Record<string, any>[]> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: tableName,
      ...params,
    }));
    return result.Items || [];
  }

  async scan(tableName: string, params: any = {}): Promise<Record<string, any>[]> {
    const result = await this.docClient.send(new ScanCommand({
      TableName: tableName,
      ...params,
    }));
    return result.Items || [];
  }
}
