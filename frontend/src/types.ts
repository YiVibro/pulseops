export type ServerStatusType = 'healthy' | 'warning' | 'critical';
export type MetricDataType = 'cpu' | 'memory' | 'disk';
export type AnomalySeverity = 'warning' | 'critical' ;

export interface MetricData{
    cpu:number;
    memory:number;
    disk:number;
    timestamp:number;
}

export interface ServerMetrics extends MetricData{
  serverId:string;
}

export interface ServerStatus{
    id:string;
    name:string;
    status:ServerStatusType;
    history:MetricData[];
}

export interface AnomalyAlert{
    id:string;
    timestamp:number;
    serverId:string;
    serverName:string;
    metric:MetricDataType;
    severity:AnomalySeverity;
}