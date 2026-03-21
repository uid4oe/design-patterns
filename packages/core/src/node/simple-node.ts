import type { SimulationEmitter } from "../stream/types.js";
import type { NodeResult, SimulationRequest } from "./types.js";
import { BaseNode } from "./base-node.js";

/**
 * SimpleNode is for stateless request-response nodes. Subclasses only need
 * to implement handleRequest(). BaseNode handles lifecycle, latency, and failures.
 */
export abstract class SimpleNode extends BaseNode {
  protected async process(
    request: SimulationRequest,
    emitter: SimulationEmitter,
  ): Promise<NodeResult> {
    emitter.emit({
      type: "processing",
      node: this.name,
      requestId: request.id,
      detail: this.getProcessingDetail(request),
    });
    return this.handleRequest(request);
  }

  /** Implement this to define how the node processes a request. */
  protected abstract handleRequest(
    request: SimulationRequest,
  ): Promise<NodeResult>;

  /** Override to customize the processing detail message. */
  protected getProcessingDetail(request: SimulationRequest): string {
    return `processing ${request.id}`;
  }
}
