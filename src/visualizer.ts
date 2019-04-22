import { MachineConfig, TransitionConfig } from './types';

/**
 * Generate a Mermaid state diagram from a machine configuration.
 * Can be pasted into Mermaid live editor or embedded in Markdown.
 */
export function generateMermaid(config: MachineConfig): string {
  const lines: string[] = ['stateDiagram-v2'];

  // Mark initial state
  lines.push(`    [*] --> ${config.initial}`);

  // Generate transitions
  for (const [stateName, stateNode] of Object.entries(config.states)) {
    if (!stateNode.on) continue;

    for (const [eventName, transitionConfig] of Object.entries(stateNode.on)) {
      const target = typeof transitionConfig === 'string'
        ? transitionConfig
        : (transitionConfig as TransitionConfig).target;

      const description = typeof transitionConfig !== 'string'
        ? (transitionConfig as TransitionConfig).description
        : undefined;

      const label = description || eventName;
      lines.push(`    ${stateName} --> ${target} : ${label}`);
    }

    // Mark final states
    if (stateNode.type === 'final') {
      lines.push(`    ${stateName} --> [*]`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate an ASCII state diagram for terminal output.
 */
export function generateAscii(config: MachineConfig): string {
  const lines: string[] = [];
  const states = Object.keys(config.states);
  const maxLen = Math.max(...states.map((s) => s.length));
  const boxWidth = maxLen + 4;

  lines.push(`State Machine: ${config.id}`);
  lines.push(`${'='.repeat(boxWidth + 20)}`);
  lines.push('');

  // Draw initial marker
  lines.push(`  --> [${config.initial}]`);
  lines.push('');

  // Draw each state and its transitions
  for (const [stateName, stateNode] of Object.entries(config.states)) {
    const padded = stateName.padEnd(maxLen);
    const isFinal = stateNode.type === 'final';
    const marker = stateName === config.initial ? '*' : (isFinal ? '#' : ' ');

    // State box
    const border = '+' + '-'.repeat(boxWidth) + '+';
    lines.push(`  ${border}`);
    lines.push(`  |${marker} ${padded}   |`);
    lines.push(`  ${border}`);

    // Transitions
    if (stateNode.on) {
      for (const [eventName, transitionConfig] of Object.entries(stateNode.on)) {
        const target = typeof transitionConfig === 'string'
          ? transitionConfig
          : (transitionConfig as TransitionConfig).target;

        const hasGuard = typeof transitionConfig !== 'string' &&
          (transitionConfig as TransitionConfig).guard;

        const guardMarker = hasGuard ? ' [guarded]' : '';
        lines.push(`      |-- ${eventName} --> [${target}]${guardMarker}`);
      }
    }

    if (isFinal) {
      lines.push(`      |-- (final state)`);
    }

    lines.push('');
  }

  // Legend
  lines.push('Legend: * = initial, # = final');

  return lines.join('\n');
}

/**
 * Generate DOT format for Graphviz visualization.
 * Output can be rendered with `dot -Tpng -o diagram.png diagram.dot`
 */
export function generateDot(config: MachineConfig): string {
  const lines: string[] = [];

  lines.push(`digraph "${config.id}" {`);
  lines.push(`    rankdir=LR;`);
  lines.push(`    node [shape=rounded, style=filled, fillcolor="#e8e8e8", fontname="Arial"];`);
  lines.push(`    edge [fontname="Arial", fontsize=10];`);
  lines.push('');

  // Initial state indicator
  lines.push(`    __start__ [shape=point, width=0.2, fillcolor=black];`);
  lines.push(`    __start__ -> "${config.initial}";`);
  lines.push('');

  // State nodes
  for (const [stateName, stateNode] of Object.entries(config.states)) {
    const attrs: string[] = [];

    if (stateName === config.initial) {
      attrs.push('fillcolor="#a8d8a8"');
    }

    if (stateNode.type === 'final') {
      attrs.push('shape=doublecircle');
      attrs.push('fillcolor="#d8a8a8"');
    }

    if (stateNode.meta?.description) {
      attrs.push(`tooltip="${stateNode.meta.description}"`);
    }

    const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
    lines.push(`    "${stateName}"${attrStr};`);
  }

  lines.push('');

  // Transitions (edges)
  for (const [stateName, stateNode] of Object.entries(config.states)) {
    if (!stateNode.on) continue;

    for (const [eventName, transitionConfig] of Object.entries(stateNode.on)) {
      const target = typeof transitionConfig === 'string'
        ? transitionConfig
        : (transitionConfig as TransitionConfig).target;

      const hasGuard = typeof transitionConfig !== 'string' &&
        (transitionConfig as TransitionConfig).guard;

      const label = hasGuard ? `${eventName}\\n[guard]` : eventName;
      lines.push(`    "${stateName}" -> "${target}" [label="${label}"];`);
    }
  }

  lines.push('}');

  return lines.join('\n');
}
