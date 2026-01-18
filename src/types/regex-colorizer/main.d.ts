declare module "regex-colorizer" {
  export type RegexColorizerOptions = { flags?: string };

  export declare function colorizePattern(
    pattern: string,
    options?: RegexColorizerOptions,
  ): string;

  export declare function colorizeAll(options?: {
    selector?: string;
    flags?: string;
  }): void;

  export declare function loadStyles(): void;
}
