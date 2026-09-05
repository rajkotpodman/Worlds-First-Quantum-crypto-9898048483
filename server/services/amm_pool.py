#!/usr/bin/env python3
"""
Shielded Automated Market Maker (AMM) Engine (x * y = k)
Implements Prompt 25 from Untitled document (1).md
"""

class AMMPool:
    def __init__(self, token_reserve: float = 10000000.0, usdc_reserve: float = 500000.0, fee: float = 0.003):
        self.r_token = token_reserve
        self.r_usdc = usdc_reserve
        self.k = self.r_token * self.r_usdc
        self.fee = fee

    def swap_token_for_usdc(self, token_in: float) -> float:
        """Swap TOK for shielded USDC with constant-product formula."""
        net_in = token_in * (1 - self.fee)
        new_token = self.r_token + net_in
        new_usdc = self.k / new_token
        usdc_out = self.r_usdc - new_usdc
        self.r_token = new_token
        self.r_usdc = new_usdc
        return round(usdc_out, 4)

    def get_price(self) -> float:
        """Current pool price ratio."""
        return round(self.r_usdc / self.r_token, 6)

if __name__ == "__main__":
    pool = AMMPool()
    print(f"Initial Price: ${pool.get_price()} USD")
    out = pool.swap_token_for_usdc(1000.0)
    print(f"Swapped 1,000 TOK -> ${out} USDC | New Price: ${pool.get_price()} USD")
