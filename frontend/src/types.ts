export type ServerStatusType = 'healthy' | 'warning' | 'critical'| 'offline';
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
    value:number;
    severity:AnomalySeverity;
    message:string;
}




export type MetricKey = 'cpu' | 'memory' | 'disk';
export type AlertSeverity = 'warning' | 'critical';

export interface MetricPoint {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
}

export interface Server {
  id: string;
  name: string;
  status: ServerStatusType;
  history: MetricPoint[];
}

export interface Alert {
  id: string;
  serverId: string;
  serverName?: string;
  metric: MetricKey;
  value: number;
  severity: AlertSeverity;
  message: string;
  created_at?: string;
  timestamp?: number;
}

export interface SocketCallbacks{
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMetric?: (data: ServerMetrics) => void;
  onAlert?: (alert: AnomalyAlert) => void;
}