import { PromptTemplate } from "../types";

export const builtInTemplates: PromptTemplate[] = [
  {
    id: "task-exec",
    name: "任务执行型",
    description: "把模糊需求变成带目标/Review/验收/自测的结构化提示词",
    fields: [
      { key: "goal", label: "目标", instruction: "提炼本次任务的明确目标" },
      { key: "review_points", label: "Review 节点", instruction: "列出需要人工 Review 的关键阶段" },
      { key: "acceptance", label: "验收标准", instruction: "定义完成的验收标准" },
      { key: "self_test", label: "自测要求", instruction: "列出交付前需自测的项" },
      { key: "pass_criteria", label: "通过判断", instruction: "明确什么情况下判定通过" },
    ],
    output: `## 目标
{{goal}}

## Review 节点
{{review_points}}

## 验收标准
{{acceptance}}

## 自测要求
{{self_test}}

## 通过判断
{{pass_criteria}}`,
  },
  {
    id: "code-gen",
    name: "代码生成型",
    description: "适合让 AI 写代码、改代码、Review 代码",
    fields: [
      { key: "goal", label: "目标", instruction: "明确要做什么（实现/重构/修复/Review）" },
      { key: "context", label: "上下文", instruction: "相关代码、技术栈、依赖版本" },
      { key: "constraints", label: "约束", instruction: "编码规范、性能要求、不能做的事" },
      { key: "io", label: "输入输出", instruction: "函数签名、输入示例、期望输出" },
      { key: "edge_cases", label: "边界情况", instruction: "需要处理的异常和边界" },
      { key: "self_test", label: "自测要求", instruction: "交付前需自测的用例" },
    ],
    output: `## 目标
{{goal}}

## 上下文
{{context}}

## 约束
{{constraints}}

## 输入输出
{{io}}

## 边界情况
{{edge_cases}}

## 自测要求
{{self_test}}`,
  },
  {
    id: "general",
    name: "通用结构化",
    description: "自由填空，适合任意场景",
    fields: [
      { key: "background", label: "背景", instruction: "说明背景和前提" },
      { key: "task", label: "任务", instruction: "明确要 AI 做什么" },
      { key: "requirements", label: "要求", instruction: "列出具体要求" },
      { key: "output_format", label: "输出格式", instruction: "期望的输出格式" },
      { key: "notes", label: "备注", instruction: "其他补充说明" },
    ],
    output: `## 背景
{{background}}

## 任务
{{task}}

## 要求
{{requirements}}

## 输出格式
{{output_format}}

## 备注
{{notes}}`,
  },
];

export const defaultTemplate = builtInTemplates[0];
