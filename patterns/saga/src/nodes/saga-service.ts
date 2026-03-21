import { SimpleNode } from "@design-patterns/core";
import type {
  NodeResult,
  SimulationRequest,
  SimulationEmitter,
  NodeConfig,
  SimulationClock,
} from "@design-patterns/core";

/**
 * Base class for saga service nodes. Each service has a forward operation
 * (handleRequest) and a compensating operation (compensate).
 */
export abstract class SagaService extends SimpleNode {
  private readonly compensationDetail: string;
  private readonly forwardDetail: string;
  private compensationCount = 0;

  constructor(
    config: NodeConfig,
    forwardDetail: string,
    compensationDetail: string,
    seed?: number,
    clock?: SimulationClock,
    realTime?: boolean,
  ) {
    super(config, seed, clock, realTime);
    this.forwardDetail = forwardDetail;
    this.compensationDetail = compensationDetail;
  }

  protected getProcessingDetail(_request: SimulationRequest): string {
    return this.forwardDetail;
  }

  /** Run compensation (reverse action) for this service. */
  async compensate(
    request: SimulationRequest,
    emitter: SimulationEmitter,
  ): Promise<NodeResult> {
    this.compensationCount++;
    emitter.emit({
      type: "processing",
      node: this.name,
      requestId: request.id,
      detail: `compensating: ${this.compensationDetail}`,
    });
    return {
      output: `${this.name}-compensated`,
      durationMs: 0,
      success: true,
      metrics: this.getMetrics(),
    };
  }

  getCompensationCount(): number {
    return this.compensationCount;
  }
}

export class OrderService extends SagaService {
  constructor(config: NodeConfig, seed?: number, clock?: SimulationClock, realTime?: boolean) {
    super(config, "creating order", "cancelling order", seed, clock, realTime);
  }

  protected async handleRequest(request: SimulationRequest): Promise<NodeResult> {
    return {
      output: `order-created-${request.id}`,
      durationMs: 0,
      success: true,
      metrics: this.getMetrics(),
    };
  }
}

export class PaymentService extends SagaService {
  constructor(config: NodeConfig, seed?: number, clock?: SimulationClock, realTime?: boolean) {
    super(config, "processing payment", "refunding payment", seed, clock, realTime);
  }

  protected async handleRequest(request: SimulationRequest): Promise<NodeResult> {
    return {
      output: `payment-processed-${request.id}`,
      durationMs: 0,
      success: true,
      metrics: this.getMetrics(),
    };
  }
}

export class InventoryService extends SagaService {
  constructor(config: NodeConfig, seed?: number, clock?: SimulationClock, realTime?: boolean) {
    super(config, "reserving inventory", "releasing inventory", seed, clock, realTime);
  }

  protected async handleRequest(request: SimulationRequest): Promise<NodeResult> {
    return {
      output: `inventory-reserved-${request.id}`,
      durationMs: 0,
      success: true,
      metrics: this.getMetrics(),
    };
  }
}

export class ShippingService extends SagaService {
  constructor(config: NodeConfig, seed?: number, clock?: SimulationClock, realTime?: boolean) {
    super(config, "scheduling shipment", "cancelling shipment", seed, clock, realTime);
  }

  protected async handleRequest(request: SimulationRequest): Promise<NodeResult> {
    return {
      output: `shipment-scheduled-${request.id}`,
      durationMs: 0,
      success: true,
      metrics: this.getMetrics(),
    };
  }
}
