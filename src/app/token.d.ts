export interface TokenProvider {
    sign(payload: any): Promise<string>;
    verify<T>(token: string): Promise<T>;
}
