import { useRef, useLayoutEffect, forwardRef, useImperativeHandle, createElement, Fragment } from 'react'
import Konva from 'konva/lib/Core'
import { KonvaRenderer } from 'react-konva'
import { ConcurrentRoot } from 'react-reconciler/constants'

// Maps React prop names → Konva event names
const EVENT_MAP = {
  onMouseDown:  'mousedown',
  onMouseMove:  'mousemove',
  onMouseUp:    'mouseup',
  onMouseLeave: 'mouseleave',
  onClick:      'click',
  onTouchStart: 'touchstart',
  onTouchMove:  'touchmove',
  onTouchEnd:   'touchend',
}

/**
 * Drop-in replacement for react-konva's <Stage> that does NOT use its-fine.
 *
 * react-konva wraps the Konva reconciler tree in its-fine's FiberProvider +
 * Bridge. The Bridge calls React 19's use(context) for every context found
 * above the Stage, subscribing StageWrap to all of them. In React 19.2.x,
 * those subscriptions interact with the concurrent scheduler across reconciler
 * roots, creating the vl/_l infinite loop (error #185).
 *
 * Our Konva children use no React context (only Zustand props passed from
 * FieldCanvas), so we don't need the Bridge. Removing it breaks the loop.
 */
const KonvaStage = forwardRef(function KonvaStage(props, ref) {
  const containerRef = useRef(null)
  const stageRef     = useRef(null)
  const fiberRef     = useRef(null)
  const propsRef     = useRef(props)

  // Keep propsRef current so stable event wrappers always call latest handler
  useLayoutEffect(() => { propsRef.current = props })

  useImperativeHandle(ref, () => stageRef.current)

  // ── Mount: create Konva.Stage + fiber root ─────────────────────────────────
  useLayoutEffect(() => {
    const stage = new Konva.Stage({
      container: containerRef.current,
      width:  props.width  || 1,
      height: props.height || 1,
    })
    stageRef.current = stage

    fiberRef.current = KonvaRenderer.createContainer(
      stage, ConcurrentRoot, null, false, null, '',
      console.error, console.error, console.error, null,
    )

    // Register stable wrapper handlers (registered once, never re-registered)
    Object.entries(EVENT_MAP).forEach(([reactName, konvaName]) => {
      stage.on(konvaName, (e) => propsRef.current[reactName]?.(e))
    })

    // Initial render of children (no Bridge, no FiberProvider)
    KonvaRenderer.updateContainer(
      createElement(Fragment, null, props.children),
      fiberRef.current, null, () => {},
    )

    return () => {
      KonvaRenderer.updateContainer(null, fiberRef.current, null)
      stage.destroy()
      // Null refs so the every-render effect's guard skips safely during
      // React StrictMode's simulate-unmount/remount cycle
      stageRef.current = null
      fiberRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Every render: sync size + re-render children ───────────────────────────
  useLayoutEffect(() => {
    const stage = stageRef.current
    const fiber = fiberRef.current
    if (!stage || !fiber) return

    if (stage.width()  !== props.width)  stage.width(props.width)
    if (stage.height() !== props.height) stage.height(props.height)

    KonvaRenderer.updateContainer(
      createElement(Fragment, null, props.children),
      fiber, null,
    )
  })

  return createElement('div', {
    ref:       containerRef,
    id:        props.id,
    className: props.className,
    role:      props.role,
    style:     props.style,
    tabIndex:  props.tabIndex,
    title:     props.title,
  })
})

export default KonvaStage
