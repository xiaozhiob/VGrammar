import type { HOOK_EVENT } from '../graph/enums';

export interface Hooks {
  // Scope
  [HOOK_EVENT.BEFORE_PARSE_VIEW]?: () => void;
  [HOOK_EVENT.AFTER_PARSE_VIEW]?: () => void;

  // View
  [HOOK_EVENT.BEFORE_TRANSFORM]?: (type: string) => void;
  [HOOK_EVENT.AFTER_TRANSFORM]?: (type: string) => void;
  [HOOK_EVENT.BEFORE_MARK_JOIN]?: () => void;
  [HOOK_EVENT.AFTER_MARK_JOIN]?: () => void;
  [HOOK_EVENT.BEFORE_MARK_UPDATE]?: () => void;
  [HOOK_EVENT.AFTER_MARK_UPDATE]?: () => void;
  [HOOK_EVENT.BEFORE_MARK_STATE]?: () => void;
  [HOOK_EVENT.AFTER_MARK_STATE]?: () => void;
  [HOOK_EVENT.BEFORE_MARK_ENCODE]?: () => void;
  [HOOK_EVENT.AFTER_MARK_ENCODE]?: () => void;

  [HOOK_EVENT.BEFORE_DO_LAYOUT]?: () => void;
  [HOOK_EVENT.AFTER_DO_LAYOUT]?: () => void;

  [HOOK_EVENT.BEFORE_MARK_LAYOUT_END]?: () => void;
  [HOOK_EVENT.AFTER_MARK_LAYOUT_END]?: () => void;

  [HOOK_EVENT.BEFORE_MARK_RENDER_END]?: () => void;
  [HOOK_EVENT.AFTER_MARK_RENDER_END]?: () => void;

  [HOOK_EVENT.BEFORE_DO_RENDER]?: () => void;
  [HOOK_EVENT.AFTER_DO_RENDER]?: () => void;

  // Scenegraph
  [HOOK_EVENT.BEFORE_CREATE_VRENDER_STAGE]?: () => void;
  [HOOK_EVENT.AFTER_CREATE_VRENDER_STAGE]?: () => void;
  [HOOK_EVENT.BEFORE_CREATE_VRENDER_LAYER]?: () => void;
  [HOOK_EVENT.AFTER_CREATE_VRENDER_LAYER]?: () => void;
  [HOOK_EVENT.BEFORE_VRENDER_DRAW]?: () => void;
  [HOOK_EVENT.AFTER_VRENDER_DRAW]?: () => void;
  [HOOK_EVENT.BEFORE_CREATE_VRENDER_MARK]?: () => void;
  [HOOK_EVENT.AFTER_CREATE_VRENDER_MARK]?: () => void;
}
