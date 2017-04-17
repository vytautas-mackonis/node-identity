export interface TokenProvider {
    sign(payload: any, expiresIn: number): Promise<string>;
    verify<T>(token: string): Promise<T>;
}
