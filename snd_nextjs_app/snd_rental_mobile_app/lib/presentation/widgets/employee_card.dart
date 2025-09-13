import 'package:flutter/material.dart';
import '../../data/models/employee_model.dart';

class EmployeeCard extends StatelessWidget {
  final EmployeeModel employee;
  final VoidCallback? onTap;

  const EmployeeCard({
    super.key,
    required this.employee,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Profile Image
              CircleAvatar(
                radius: 30,
                backgroundImage: employee.profileImageUrl != null
                    ? NetworkImage(employee.profileImageUrl!)
                    : null,
                child: employee.profileImageUrl == null
                    ? Text(
                        employee.firstName[0].toUpperCase(),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              
              // Employee Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      employee.displayName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      employee.email,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    if (employee.position != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        employee.position!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                    if (employee.department != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        employee.department!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              
              // Status Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: employee.isActive ? Colors.green : Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  employee.status?.toUpperCase() ?? 'UNKNOWN',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
