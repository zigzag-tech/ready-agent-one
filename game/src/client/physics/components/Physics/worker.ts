/* eslint-disable import/no-webpack-loader-syntax */
import { WorkerMessageType } from "../../../workers/physics/types";
import Worker from "../../../workers/physics/physicsWorker?worker";
import {
  AddBodyProps,
  RemoveBodyProps,
  SetBodyProps,
  UpdateBodyProps,
} from "../../bodies";

export const gamePhysicsWorker = new Worker();

export const workerAddBody = (props: AddBodyProps) => {
  gamePhysicsWorker.postMessage({
    type: WorkerMessageType.ADD_BODY,
    props: props,
  });
};

export const workerRemoveBody = (props: RemoveBodyProps) => {
  gamePhysicsWorker.postMessage({
    type: WorkerMessageType.REMOVE_BODY,
    props,
  });
};

export const workerSetBody = (props: SetBodyProps) => {
  gamePhysicsWorker.postMessage({
    type: WorkerMessageType.SET_BODY,
    props,
  });
};

export const workerUpdateBody = (props: UpdateBodyProps) => {
  gamePhysicsWorker.postMessage({
    type: WorkerMessageType.UPDATE_BODY,
    props,
  });
};
