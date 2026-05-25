import { describe, it, expect } from "vitest";
import { adjustStatBlock, halfLevelBonus } from "./adjustStatBlock";

describe("halfLevelBonus", () => {
  it("returns 0 for level 1", () => {
    expect(halfLevelBonus(1)).toBe(0);
  });

  it("returns 1 for level 2", () => {
    expect(halfLevelBonus(2)).toBe(1);
  });

  it("returns 5 for level 10", () => {
    expect(halfLevelBonus(10)).toBe(5);
  });

  it("returns 10 for level 20", () => {
    expect(halfLevelBonus(20)).toBe(10);
  });

  it("returns 15 for level 30", () => {
    expect(halfLevelBonus(30)).toBe(15);
  });
});

describe("adjustStatBlock", () => {
  it("returns HTML unchanged for level 1 (bonus = 0)", () => {
    const html = '<b>HP</b> 28; <b>Bloodied</b> 14';
    expect(adjustStatBlock(html, 1, "Standard")).toBe(html);
  });

  describe("HP adjustment", () => {
    it("increases HP for a Standard monster (×4 multiplier)", () => {
      const html = '<b>HP</b> 100; <b>Bloodied</b> 50';
      const result = adjustStatBlock(html, 10, "Standard");
      // bonus = 5, multiplier = 4, HP increase = 20
      expect(result).toContain('<b>HP</b> 120; <b>Bloodied</b> 60');
    });

    it("increases HP for an Elite monster (×8 multiplier)", () => {
      const html = '<b>HP</b> 100; <b>Bloodied</b> 50';
      const result = adjustStatBlock(html, 10, "Elite");
      // bonus = 5, multiplier = 8, HP increase = 40
      expect(result).toContain('<b>HP</b> 140; <b>Bloodied</b> 70');
    });

    it("increases HP for a Solo monster (×20 multiplier)", () => {
      const html = '<b>HP</b> 315; <b>Bloodied</b> 157';
      const result = adjustStatBlock(html, 10, "Solo");
      // bonus = 5, multiplier = 20, HP increase = 100
      expect(result).toContain('<b>HP</b> 415; <b>Bloodied</b> 207');
    });

    it("recalculates Bloodied as floor(newHP / 2)", () => {
      const html = '<b>HP</b> 57; <b>Bloodied</b> 28';
      const result = adjustStatBlock(html, 4, "Elite");
      // bonus = 2, multiplier = 8, HP increase = 16 → 73 HP, Bloodied = 36
      expect(result).toContain('<b>HP</b> 73; <b>Bloodied</b> 36');
    });
  });

  describe("damage adjustment", () => {
    it("adds bonus to XdY+Z damage expressions", () => {
      const html = '+16 vs AC; 2d6+8 damage.';
      const result = adjustStatBlock(html, 10, "Standard");
      // bonus = 5
      expect(result).toContain('2d6 + 13 damage');
    });

    it("adds bonus to XdY + Z damage expressions (with spaces)", () => {
      const html = '+16 vs AC; 2d6 + 8 damage.';
      const result = adjustStatBlock(html, 10, "Standard");
      expect(result).toContain('2d6 + 13 damage');
    });

    it("handles XdY-Z damage expressions", () => {
      const html = '1d8-2 damage';
      const result = adjustStatBlock(html, 10, "Standard");
      // bonus = 5, -2+5 = +3
      expect(result).toContain('1d8 + 3 damage');
    });

    it("adds modifier to bare XdY damage expressions", () => {
      const html = '3d8 damage';
      const result = adjustStatBlock(html, 10, "Standard");
      // bonus = 5
      expect(result).toContain('3d8 + 5 damage');
    });

    it("handles damage type keywords between modifier and 'damage'", () => {
      const html = '2d8 + 8 fire damage.';
      const result = adjustStatBlock(html, 10, "Standard");
      expect(result).toContain('2d8 + 13 fire damage');
    });

    it("handles cold damage type", () => {
      const html = '1d8+5 cold damage';
      const result = adjustStatBlock(html, 10, "Standard");
      expect(result).toContain('1d8 + 10 cold damage');
    });

    it("adjusts ongoing damage", () => {
      const html = 'ongoing 6 poison damage (save ends)';
      const result = adjustStatBlock(html, 10, "Standard");
      // bonus = 5
      expect(result).toContain('ongoing 11 poison damage');
    });

    it("adjusts aura damage with 'takes N damage' pattern", () => {
      const html = 'takes 13 cold damage';
      const result = adjustStatBlock(html, 10, "Standard");
      // bonus = 5
      expect(result).toContain('takes 18 cold damage');
    });

    it("does not modify attack bonus numbers", () => {
      const html = '+16 vs AC; 2d6+8 damage.';
      const result = adjustStatBlock(html, 10, "Standard");
      expect(result).toContain('+16 vs AC');
    });

    it("handles multiple damage expressions in the same block", () => {
      const html = '2d8 + 10 damage, and ongoing 12 fire damage (save ends)';
      const result = adjustStatBlock(html, 10, "Standard");
      expect(result).toContain('2d8 + 15 damage');
      expect(result).toContain('ongoing 17 fire damage');
    });

    it("handles 'extra damage' keyword", () => {
      const html = '1d6 extra damage';
      const result = adjustStatBlock(html, 10, "Standard");
      expect(result).toContain('1d6 + 5 extra damage');
    });

    it("handles dual damage types like 'poison and psychic damage'", () => {
      const html = '3d6+6 poison and psychic damage';
      const result = adjustStatBlock(html, 10, "Standard");
      expect(result).toContain('3d6 + 11 poison and psychic damage');
    });

    it("handles 'plus N type damage' riders", () => {
      const html = 'plus 5 necrotic damage';
      const result = adjustStatBlock(html, 10, "Standard");
      expect(result).toContain('plus 10 necrotic damage');
    });
  });

  describe("full stat block integration", () => {
    it("adjusts a realistic stat block correctly", () => {
      const html = [
        '<b>HP</b> 140; <b>Bloodied</b> 70',
        '<p>+25 vs. AC</p>',
        '<p>2d10 + 10 damage, and ongoing 15 damage (save ends)</p>',
      ].join('\n');

      const result = adjustStatBlock(html, 20, "Standard");
      // bonus = 10, HP + 40 = 180, Bloodied = 90
      expect(result).toContain('<b>HP</b> 180; <b>Bloodied</b> 90');
      expect(result).toContain('2d10 + 20 damage');
      expect(result).toContain('ongoing 25 damage');
      // Attack bonus should stay unchanged
      expect(result).toContain('+25 vs. AC');
    });

    it("handles a stat block with typed damage and multiple attacks", () => {
      const html = [
        '<b>HP</b> 315; <b>Bloodied</b> 157',
        '<p>+16 vs AC; 2d6 + 8 damage.</p>',
        '<p>+16 vs AC; 2d6 + 5 damage.</p>',
        '<p>3d6 + 1 fire damage.</p>',
      ].join('\n');

      const result = adjustStatBlock(html, 10, "Solo");
      expect(result).toContain('<b>HP</b> 415; <b>Bloodied</b> 207');
      expect(result).toContain('2d6 + 13 damage');
      expect(result).toContain('2d6 + 10 damage');
      expect(result).toContain('3d6 + 6 fire damage');
    });
  });

  describe("minion handling", () => {
    it("does NOT increase HP for minions", () => {
      const html = '<b>HP</b> 1; <b>Bloodied</b> 0';
      const result = adjustStatBlock(html, 10, "Standard", "Minion");
      expect(result).toContain('<b>HP</b> 1; <b>Bloodied</b> 0');
    });

    it("adjusts flat damage after semicolons (minion attack style)", () => {
      const html = '+18 vs AC; 5 damage.';
      const result = adjustStatBlock(html, 10, "Standard", "Minion");
      expect(result).toContain('; 10 damage');
    });

    it("adjusts flat typed damage after semicolons", () => {
      const html = '+9 vs AC; 5 acid damage';
      const result = adjustStatBlock(html, 10, "Standard", "Minion");
      expect(result).toContain('; 10 acid damage');
    });

    it("adjusts 'Hit: N damage' format", () => {
      const html = 'Hit: 8 damage.';
      const result = adjustStatBlock(html, 10, "Standard", "Minion");
      expect(result).toContain('Hit: 13 damage');
    });

    it("adjusts flat typed damage with Hit: format", () => {
      const html = 'Hit: 7 poison damage';
      const result = adjustStatBlock(html, 10, "Standard", "Minion");
      expect(result).toContain('Hit: 12 poison damage');
    });

    it("does not modify attack bonus numbers", () => {
      const html = '+18 vs AC; 5 damage.';
      const result = adjustStatBlock(html, 10, "Standard", "Minion");
      expect(result).toContain('+18 vs AC');
    });
  });
});
