import { BaseSequencer, TestSpecification } from 'vitest/node';
import { SNAPSHOT_FIXTURE_FILENAME } from './constants';

export default class SnapshotLastSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return [...files].sort((a, b) => {
      const aPath = a.moduleId;
      const bPath = b.moduleId;
      const isA = aPath.endsWith(SNAPSHOT_FIXTURE_FILENAME);
      const isB = bPath.endsWith(SNAPSHOT_FIXTURE_FILENAME);
      if (isA && !isB) return 1;
      if (!isA && isB) return -1;
      return aPath.localeCompare(bPath);
    });
  }
}
