import { Injectable } from '@nestjs/common';
import { TemplateChannelType } from './constants/template.enums';
import { TemplateDocument } from './schemas/template.schema';
import { TemplatesVariableService } from './templates-variable.service';
import { TemplatePreviewResponse } from './types/template.response';

@Injectable()
export class TemplatesPreviewService {
  constructor(private readonly variableService: TemplatesVariableService) {}

  renderTemplate(
    template: TemplateDocument,
    sampleData: Record<string, unknown>,
  ): TemplatePreviewResponse {
    if (template.channelType === TemplateChannelType.EMAIL && template.email) {
      const subject = this.variableService.renderText(template.email.subject, sampleData);
      const previewText = this.variableService.renderText(template.email.previewText, sampleData);
      const htmlBody = this.variableService.renderText(template.email.htmlBody, sampleData);
      const textBody = this.variableService.renderText(template.email.textBody, sampleData);

      return {
        templateId: template.id,
        channelType: TemplateChannelType.EMAIL,
        sampleData,
        rendered: {
          subject: subject.rendered,
          previewText: previewText.rendered,
          htmlBody: htmlBody.rendered,
          textBody: textBody.rendered,
        },
        unresolvedVariables: Array.from(
          new Set([
            ...subject.unresolvedVariables,
            ...previewText.unresolvedVariables,
            ...htmlBody.unresolvedVariables,
            ...textBody.unresolvedVariables,
          ]),
        ),
      };
    }

    if (template.channelType === TemplateChannelType.WHATSAPP && template.whatsapp) {
      const templateName = this.variableService.renderText(
        template.whatsapp.templateName,
        sampleData,
      );
      const language = this.variableService.renderText(template.whatsapp.language, sampleData);
      const bodyParams = template.whatsapp.bodyParams.map((param) =>
        this.variableService.renderText(param, sampleData),
      );
      const headerParams = template.whatsapp.headerParams.map((param) =>
        this.variableService.renderText(param, sampleData),
      );
      const buttonParams = template.whatsapp.buttonParams.map((param) =>
        this.variableService.renderText(param, sampleData),
      );

      return {
        templateId: template.id,
        channelType: TemplateChannelType.WHATSAPP,
        sampleData,
        rendered: {
          templateName: templateName.rendered,
          language: language.rendered,
          bodyParams: bodyParams.map((item) => item.rendered),
          headerParams: headerParams.map((item) => item.rendered),
          buttonParams: buttonParams.map((item) => item.rendered),
        },
        unresolvedVariables: Array.from(
          new Set([
            ...templateName.unresolvedVariables,
            ...language.unresolvedVariables,
            ...bodyParams.flatMap((item) => item.unresolvedVariables),
            ...headerParams.flatMap((item) => item.unresolvedVariables),
            ...buttonParams.flatMap((item) => item.unresolvedVariables),
          ]),
        ),
      };
    }

    return {
      templateId: template.id,
      channelType: template.channelType,
      sampleData,
      rendered: {},
      unresolvedVariables: [],
    };
  }
}
