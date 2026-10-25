import type * as React from 'react';
export type IconName = 'home' | 'list' | 'plus' | 'minus' | 'chart' | 'user' | 'play' | 'pause' | 'check' | 'x' | 'timer' | 'chevron-right' | 'arrow-up' | 'arrow-down' | 'flame' | 'dumbbell';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' | 'lg'; block?: boolean; icon?: IconName }
export declare function Button(props: ButtonProps): React.ReactElement;
export interface ChipProps { selected?: boolean; onClick?: () => void; children?: React.ReactNode }
export declare function Chip(props: ChipProps): React.ReactElement;
export interface BadgeProps { tone?: 'pr' | 'done' | 'missed' | 'neutral'; children?: React.ReactNode }
export declare function Badge(props: BadgeProps): React.ReactElement;
export interface TaglineProps { words?: string[]; size?: string }
export declare function Tagline(props: TaglineProps): React.ReactElement;
export interface BracketTitleProps { size?: 's' | 'm' | 'l'; as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p'; className?: string; children?: React.ReactNode }
export declare function BracketTitle(props: BracketTitleProps): React.ReactElement;
export interface EchoHeadlineProps { text: string; lines?: number; size?: string }
export declare function EchoHeadline(props: EchoHeadlineProps): React.ReactElement;
export interface RingsProps { count?: number; size?: number; offset?: string }
export declare function Rings(props: RingsProps): React.ReactElement;
export interface StatTileProps { label: string; value: string | number; unit?: string; delta?: string; trend?: 'up' | 'down'; highlight?: boolean }
export declare function StatTile(props: StatTileProps): React.ReactElement;
export interface ProgressRingProps { value: number; size?: number; stroke?: number; label?: string; ariaLabel?: string; className?: string; children?: React.ReactNode }
export declare function ProgressRing(props: ProgressRingProps): React.ReactElement;
export interface RestTimerProps { total?: number; seconds?: number; size?: number; label?: string; onSkip?: () => void }
export declare function RestTimer(props: RestTimerProps): React.ReactElement;
export interface StepperProps { value?: number; step?: number; unit?: string; min?: number; label?: string; onChange?: (value: number) => void }
export declare function Stepper(props: StepperProps): React.ReactElement;
export interface SetEntry { prev?: string; weight: number | string; reps: number | string; done?: boolean }
export interface SetTableProps { sets: SetEntry[]; unit?: string; onChange?: (sets: SetEntry[]) => void }
export declare function SetTable(props: SetTableProps): React.ReactElement;
export interface ExerciseCardProps { index: number; name: string; detail?: string; muscles?: string[]; status?: 'done' | 'pr' | 'missed'; onClick?: () => void }
export declare function ExerciseCard(props: ExerciseCardProps): React.ReactElement;
export interface ProgrammeCardProps { title: string; image?: string; imageAlt?: string; weeks?: number; perWeek?: number; level?: string; description?: string; action?: React.ReactNode; rings?: boolean; width?: string | number }
export declare function ProgrammeCard(props: ProgrammeCardProps): React.ReactElement;
export interface TabItem { id: string; label: string; icon: IconName; primary?: boolean }
export interface TabBarProps { items?: TabItem[]; active?: string; onChange?: (id: string) => void }
export declare function TabBar(props: TabBarProps): React.ReactElement;
export interface IconProps { name: IconName; size?: number; title?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;
declare global { interface Window { PressUp: { Button: typeof Button; Chip: typeof Chip; Badge: typeof Badge; Tagline: typeof Tagline; BracketTitle: typeof BracketTitle; EchoHeadline: typeof EchoHeadline; Rings: typeof Rings; StatTile: typeof StatTile; ProgressRing: typeof ProgressRing; RestTimer: typeof RestTimer; Stepper: typeof Stepper; SetTable: typeof SetTable; ExerciseCard: typeof ExerciseCard; ProgrammeCard: typeof ProgrammeCard; TabBar: typeof TabBar; Icon: typeof Icon } } }
