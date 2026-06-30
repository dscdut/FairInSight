import { Module } from 'packages/handler/Module';
import { DraftController } from './draft.controller';

export const DraftResolver = Module.builder()
     .addPrefix({
         prefixPath: '/drafts',
         tag: 'drafts',
         module: 'DraftModule'
     })
     .register([
         {
             route: '/',
             method: 'get',
             controller: DraftController.listDrafts,
             preAuthorization: true
         }
     ]);
