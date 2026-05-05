import { EventEmitter, type EventListener } from "@/lib/eventEmitter";

export interface WorkflowSelectedEventPayload {
  label: string;
}

const workflowEventEmitter = new EventEmitter();

export const emitWorkflowSelected = (
  workflowSelectedEvent: string,
  payload: WorkflowSelectedEventPayload,
) => {
  workflowEventEmitter.emit(workflowSelectedEvent, payload);
};

export const onWorkflowSelected = (
  workflowSelectedEvent: string,
  listener: EventListener<WorkflowSelectedEventPayload>,
) => {
  return workflowEventEmitter.on(
    workflowSelectedEvent,
    listener as EventListener<unknown>,
  );
};
