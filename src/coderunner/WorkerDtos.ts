import BookNodeModel from "../models/BookNodeModel";
import { SessionFile } from "../models/SessionFile";
import { TestCase } from "../models/Tests";

export type WorkerCommand =
  | "init"
  | "setSharedBuffers"
  | "install-deps"
  | "debug";

export type WorkerInitDto = {
  cmd: "init";
  standalone: boolean;
};

export type WorkerSetSharedBuffersDto = {
  cmd: "setSharedBuffers";
  interruptBuffer: Uint8Array;
  keyDownBuffer: Uint8Array;
};

export type WorkerInstallDepsDto = {
  cmd: "install-deps";
  deps: string[];
};

export type WorkerDebugDto = {
  cmd: "debug";
  initCode?: string;
  code: string;
  breakpoints: number[] | null;
  watches: string[] | null;
  sessionFiles: SessionFile[] | null;
  isSessionFilesAllowed?: boolean;
};

export type WorkerRunDto = {
  cmd: "run";
  initCode?: string;
  code: string;
  sessionFiles: SessionFile[] | null;
  isSessionFilesAllowed?: boolean;
};

export type WorkerTestDto = {
  cmd: "test";
  initCode?: string;
  code: string;
  tests: TestCase[];
  bookNode: BookNodeModel;
  sessionFiles: SessionFile[] | null;
  isSessionFilesAllowed?: boolean;
};

export type WorkerDrawTurtleExampleDto = {
  cmd: "draw-turtle-example";
  code: string;
  inputs: string[];
  bookNode: BookNodeModel;
};

export type WorkerData =
  | WorkerInitDto
  | WorkerSetSharedBuffersDto
  | WorkerInstallDepsDto
  | WorkerDebugDto
  | WorkerRunDto
  | WorkerTestDto
  | WorkerDrawTurtleExampleDto;
