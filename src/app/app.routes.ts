import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'tarefas',
    loadComponent: () => import('./tarefas/tarefas.page').then( m => m.TarefasPage)
  },
  {
  path: 'fazer-tarefa/:id',
  loadComponent: () =>
    import('./fazer-tarefa/fazer-tarefa.page')
      .then(m => m.FazerTarefaPage)
},
{
  path: 'conferir-tarefa/:id',
  loadComponent: () =>
    import('./conferir-tarefa/conferir-tarefa.page')
      .then(m => m.ConferirTarefaPage)
},

  {
    path: 'add-tarefa',
    loadComponent: () => import('./add-tarefa/add-tarefa.page').then( m => m.AddTarefaPage)
  },
];
