#include<stdio.h>
#include<stdlib.h>
#include<string.h>

#define MAX_TASKS 100
#define NAME_SIZE 50
typedef struct{
    int id;
    char subject[NAME_SIZE];
    char topic[NAME_SIZE];
    int duriation;
    int priority;
    int completed;

} Task;

Task tasks[MAX_TASKS];
int taskCount = 0;

/* Function declarations */
void addTask();
void viewTasks();
void completeTask();
void deleteTask();
void saveTasks();
void loadTasks();
void showMenu();

void addTask() {
    if (taskCount >= MAX_TASKS) {
        printf("\nTask limit reached!\n");
        return;
    }

    Task *t = &tasks[taskCount];

    t->id = taskCount + 1;

    printf("\nEnter subject name: ");
    scanf(" %[^\n]", t->subject);

    printf("Enter topic: ");
    scanf(" %[^\n]", t->topic);

    printf("Enter study duration (minutes): ");
    scanf("%d", &t->duriation);

    printf("Enter priority (1 = Low, 2 = Medium, 3 = High): ");
    scanf("%d", &t->priority);

    t->completed = 0;

    taskCount++;

    printf("\nTask added successfully!\n");
}

void viewTasks() {
    if (taskCount == 0) {
        printf("\nNo study tasks available.\n");
        return;
    }

    printf("\n================ STUDY TASKS ================\n");

    for (int i = 0; i < taskCount; i++) {
        printf("\nID       : %d", tasks[i].id);
        printf("\nSubject  : %s", tasks[i].subject);
        printf("\nTopic    : %s", tasks[i].topic);
        printf("\nDuration : %d minutes", tasks[i].duriation);

        printf("\nPriority : ");

        if (tasks[i].priority == 1)
            printf("Low");
        else if (tasks[i].priority == 2)
            printf("Medium");
        else
            printf("High");

        printf("\nStatus   : ");

        if (tasks[i].completed)
            printf("Completed");
        else
            printf("Pending");

        printf("\n---------------------------------------------\n");
    }
}

void completeTask() {
    int id;

    printf("\nEnter task ID to complete: ");
    scanf("%d", &id);

    for (int i = 0; i < taskCount; i++) {
        if (tasks[i].id == id) {

            if (tasks[i].completed) {
                printf("\nTask is already completed.\n");
            } else {
                tasks[i].completed = 1;
                printf("\nTask marked as completed!\n");
            }

            return;
        }
    }

    printf("\nTask not found.\n");
}

void deleteTask() {
    int id;

    printf("\nEnter task ID to delete: ");
    scanf("%d", &id);

    for (int i = 0; i < taskCount; i++) {

        if (tasks[i].id == id) {

            for (int j = i; j < taskCount - 1; j++) {
                tasks[j] = tasks[j + 1];
            }

            taskCount--;

            /* Reassign IDs */
            for (int j = 0; j < taskCount; j++) {
                tasks[j].id = j + 1;
            }

            printf("\nTask deleted successfully!\n");
            return;
        }
    }

    printf("\nTask not found.\n");
}

void saveTasks() {
    FILE *file = fopen("study_tasks.dat", "wb");

    if (file == NULL) {
        printf("\nError saving tasks!\n");
        return;
    }

    fwrite(&taskCount, sizeof(int), 1, file);
    fwrite(tasks, sizeof(Task), taskCount, file);

    fclose(file);
}

void loadTasks() {
    FILE *file = fopen("study_tasks.dat", "rb");

    if (file == NULL) {
        return;
    }

    fread(&taskCount, sizeof(int), 1, file);
    fread(tasks, sizeof(Task), taskCount, file);

    fclose(file);
}
void showMenu() {
    printf("\n\n=============================================");
    printf("\n           STUDY PLANNER");
    printf("\n=============================================");
    printf("\n1. Add Study Task");
    printf("\n2. View Study Tasks");
    printf("\n3. Mark Task as Completed");
    printf("\n4. Delete Task");
    printf("\n5. Exit");
    printf("\n=============================================");
}

/*main function*/

int main() {
    int choice;

    loadTasks();

    while (1) {

        showMenu();

        printf("\nEnter your choice: ");
        scanf("%d", &choice);

        switch (choice) {

            case 1:
                addTask();
                saveTasks();
                break;

            case 2:
                viewTasks();
                break;

            case 3:
                completeTask();
                saveTasks();
                break;

            case 4:
                deleteTask();
                saveTasks();
                break;

            case 5:
                saveTasks();
                printf("\nThank you for using Study Planner!\n");
                exit(0);

            default:
                printf("\nInvalid choice! Please try again.\n");
        }
    }

    return 0;
}