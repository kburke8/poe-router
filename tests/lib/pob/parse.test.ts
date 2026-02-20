// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parsePobXml } from '@/lib/pob/parse';

describe('parsePobXml', () => {
  it('extracts class and ascendancy', () => {
    const xml = `<PathOfBuilding>
      <Build className="Witch" ascendClassName="Elementalist"/>
      <Skills></Skills>
    </PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.className).toBe('Witch');
    expect(result.ascClassName).toBe('Elementalist');
  });

  it('parses flat skill structure', () => {
    const xml = `<PathOfBuilding>
      <Build className="Witch" ascendClassName=""/>
      <Skills>
        <Skill label="Main" slot="Body Armour" enabled="true">
          <Gem nameSpec="Fireball" enabled="true"/>
          <Gem nameSpec="Spell Echo" enabled="true"/>
        </Skill>
      </Skills>
    </PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.skillGroups).toHaveLength(1);
    expect(result.skillGroups[0].gems).toHaveLength(2);
    expect(result.skillGroups[0].gems[0].nameSpec).toBe('Fireball');
    expect(result.skillGroups[0].label).toBe('Main');
    expect(result.skillGroups[0].slot).toBe('Body Armour');
  });

  it('parses SkillSet wrappers with level annotations', () => {
    const xml = `<PathOfBuilding>
      <Build className="Witch" ascendClassName=""/>
      <Skills activeSkillSet="1">
        <SkillSet id="1" title="Level 2">
          <Skill label="Early" slot="" enabled="true">
            <Gem nameSpec="Fireball" enabled="true"/>
          </Skill>
        </SkillSet>
        <SkillSet id="2" title="Level 28">
          <Skill label="Mid" slot="" enabled="true">
            <Gem nameSpec="Fireball" enabled="true"/>
            <Gem nameSpec="Spell Echo" enabled="true"/>
          </Skill>
        </SkillSet>
      </Skills>
    </PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.skillSets).toHaveLength(2);
    expect(result.skillSets[0].title).toBe('Level 2');
    expect(result.skillSets[1].title).toBe('Level 28');
    expect(result.activeSkillSetId).toBe('1');
    // Default skillGroups should come from the active set
    expect(result.skillGroups).toHaveLength(1);
    expect(result.skillGroups[0].gems[0].nameSpec).toBe('Fireball');
  });

  it('skips empty skill groups (no Gem children)', () => {
    const xml = `<PathOfBuilding>
      <Build className="Witch" ascendClassName=""/>
      <Skills>
        <Skill label="Empty" slot="" enabled="true">
        </Skill>
        <Skill label="Has Gems" slot="" enabled="true">
          <Gem nameSpec="Arc" enabled="true"/>
        </Skill>
      </Skills>
    </PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.skillGroups).toHaveLength(1);
    expect(result.skillGroups[0].label).toBe('Has Gems');
  });

  it('throws for missing Build element', () => {
    const xml = `<PathOfBuilding><Skills></Skills></PathOfBuilding>`;
    expect(() => parsePobXml(xml)).toThrow('no <Build> element');
  });

  it('handles disabled groups', () => {
    const xml = `<PathOfBuilding>
      <Build className="Witch" ascendClassName=""/>
      <Skills>
        <Skill label="Disabled" slot="" enabled="false">
          <Gem nameSpec="Arc" enabled="true"/>
        </Skill>
      </Skills>
    </PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.skillGroups).toHaveLength(1);
    expect(result.skillGroups[0].enabled).toBe(false);
  });

  it('extracts gemId and skillId', () => {
    const xml = `<PathOfBuilding>
      <Build className="Witch" ascendClassName=""/>
      <Skills>
        <Skill label="Test" slot="" enabled="true">
          <Gem nameSpec="Fireball" enabled="true" gemId="abc123" skillId="skill456"/>
        </Skill>
      </Skills>
    </PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.skillGroups[0].gems[0].gemId).toBe('abc123');
    expect(result.skillGroups[0].gems[0].skillId).toBe('skill456');
  });

  it('handles XML with no Skills element', () => {
    const xml = `<PathOfBuilding>
      <Build className="Witch" ascendClassName=""/>
    </PathOfBuilding>`;
    const result = parsePobXml(xml);
    expect(result.skillGroups).toEqual([]);
    expect(result.skillSets).toEqual([]);
  });
});
