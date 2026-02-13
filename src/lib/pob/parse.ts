export interface PobGem {
  nameSpec: string;
  enabled: boolean;
  gemId?: string;
  skillId?: string;
}

export interface PobSkillGroup {
  label: string;
  slot: string;
  enabled: boolean;
  gems: PobGem[];
}

export interface PobSkillSet {
  id: string;
  title: string;
  skillGroups: PobSkillGroup[];
}

export interface PobBuild {
  className: string;
  ascClassName: string;
  skillGroups: PobSkillGroup[];
  skillSets: PobSkillSet[];
  activeSkillSetId: string | null;
}

function parseSkillGroups(container: Element): PobSkillGroup[] {
  const groups: PobSkillGroup[] = [];
  const skillEls = container.querySelectorAll(':scope > Skill');

  for (const skillEl of skillEls) {
    if (skillEl.querySelector(':scope > Gem') === null) continue;
    const label = skillEl.getAttribute('label') ?? '';
    const slot = skillEl.getAttribute('slot') ?? '';
    const enabled = skillEl.getAttribute('enabled') !== 'false';

    const gems: PobGem[] = [];
    const gemEls = skillEl.querySelectorAll(':scope > Gem');
    for (const gemEl of gemEls) {
      const nameSpec = gemEl.getAttribute('nameSpec') ?? '';
      const gemEnabled = gemEl.getAttribute('enabled') !== 'false';
      const gemId = gemEl.getAttribute('gemId') || undefined;
      const skillId = gemEl.getAttribute('skillId') || undefined;

      if (nameSpec) {
        gems.push({ nameSpec, enabled: gemEnabled, gemId, skillId });
      }
    }

    if (gems.length > 0) {
      groups.push({ label, slot, enabled, gems });
    }
  }

  return groups;
}

/**
 * Parse a PoB XML string into a structured PobBuild.
 */
export function parsePobXml(xml: string): PobBuild {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid PoB XML: ' + parseError.textContent);
  }

  const buildEl = doc.querySelector('Build');
  if (!buildEl) {
    throw new Error('Invalid PoB XML: no <Build> element found');
  }

  const className = buildEl.getAttribute('className') ?? '';
  const ascClassName = buildEl.getAttribute('ascendClassName') ?? '';

  const skillSets: PobSkillSet[] = [];
  let activeSkillSetId: string | null = null;
  let skillGroups: PobSkillGroup[] = [];

  const skillsEl = doc.querySelector('Skills');
  if (skillsEl) {
    activeSkillSetId = skillsEl.getAttribute('activeSkillSet');
    const skillSetEls = skillsEl.querySelectorAll(':scope > SkillSet');

    if (skillSetEls.length > 0) {
      // Has SkillSet wrappers — parse each one
      for (const ssEl of skillSetEls) {
        const id = ssEl.getAttribute('id') ?? '';
        const title = ssEl.getAttribute('title') ?? '';
        skillSets.push({ id, title, skillGroups: parseSkillGroups(ssEl) });
      }

      // Default skillGroups to the active set's groups
      const activeSet = skillSets.find((ss) => ss.id === activeSkillSetId);
      skillGroups = activeSet?.skillGroups ?? skillSets[0]?.skillGroups ?? [];
    } else {
      // No SkillSet wrappers — Skill elements directly under Skills
      skillGroups = parseSkillGroups(skillsEl);
    }
  }

  return { className, ascClassName, skillGroups, skillSets, activeSkillSetId };
}
