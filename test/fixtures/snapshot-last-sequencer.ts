import { BaseSequencer, TestSpecification } from 'vitest/node';

const SUFFIX = 'consistency.test.ts';

export default class SnapshotLastSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return [...files].sort((a, b) => {
      const aPath = a.moduleId;
      const bPath = b.moduleId;
      const isA = aPath.endsWith(SUFFIX);
      const isB = bPath.endsWith(SUFFIX);
      if (isA && !isB) return 1;
      if (!isA && isB) return -1;
      return aPath.localeCompare(bPath);
    });
  }
}
